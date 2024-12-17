import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";
import express, {
	type Request,
	type Response,
	type NextFunction,
} from "express";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
let enhancedPrisma: ReturnType<typeof enhance<PrismaClient>>;

app.post("/api/user", async (req: Request, res: Response) => {
	try {
		const { name, email, role, type } = req.body;

		const user = await prisma.user.create({
			data: { name, email, role, type },
		});
		res.status(201).json(user);
	} catch (error) {
		console.log("error", error);

		res.status(500).json({ error: error });
	}
});

// ENHANCED PRISMA

app.use((req, res, next) => {
	const userId = req.header("X-USER-ID");
	if (!userId) {
		res.status(403).json({ error: "unauthorized" });
	} else {
		next();
	}
});

const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const userId = req.header("X-USER-ID");
		if (!userId) {
			res.status(401).json({ error: "No user ID provided" });
			return;
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				// Tambahkan ini untuk mendapatkan data teams
				teams: {
					include: {
						team: true,
					},
				},
			},
		});

		if (!user) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		res.locals.user = user;
		next();
	} catch (error) {
		res.status(401).json({ error: "Authentication failed" });
	}
};

app.use("/api", authMiddleware);

const enhancedPrismaMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	enhancedPrisma = enhance(prisma, {
		user: {
			id: res.locals.user.id,
			role: res.locals.user.role,
			teams: res.locals.user.teams, // Tambahkan ini
		},
	});
	next();
};

app.use("/api", enhancedPrismaMiddleware);

app.get("/api/user", async (req, res) => {
	try {
		console.log("usersIdLoca", res.locals.user.id);

		const users = await enhancedPrisma.user.findMany({
			include: {
				teams: {
					include: {
						team: true,
					},
				},
			},
		});

		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ error: error });
	}
});

// TEAM

app.get("/api/team", async (req: Request, res: Response) => {
	try {
		const team = await enhancedPrisma.team.findMany({
			include: {
				members: true,
			},
		});
		res.status(201).json(team);
	} catch (error) {
		res.status(500).json({ error });
	}
});

app.post("/api/team", async (req: Request, res: Response) => {
	try {
		const { name, description } = req.body;

		const logged = res.locals.user.id;

		const role = res.locals.user;

		console.log("role", role);

		const team = await enhancedPrisma.team.create({
			data: {
				name,
				description,
				members: {
					create: {
						userId: logged,
						role: "TEAM_LEADER",
					},
				},
			},
		});
		res.status(201).json(team);
	} catch (error) {
		res.status(500).json({ error });
	}
});

// BELOM BISA
app.put("/api/team/:id", async (req, res) => {
	try {
		console.log("User context:", res.locals.user);
		// console.log("Enhanced prisma user:", enhancedPrisma);

		const { name, description } = req.body;
		const { id } = req.params;

		const findTeam = await enhancedPrisma.team.findUnique({
			where: {
				id: id,
			},
		});

		if (!findTeam) {
			throw Error("There is no ID team");
		}

		const team = await enhancedPrisma.team.update({
			where: { id: id },
			data: { name, description },
		});
		res.status(200).json(team);
	} catch (error) {
		console.log("error", error);

		res.status(500).json({ error: error });
	}
});

// TEAM MEMBER

app.post("/api/team-members", async (req, res) => {
	try {
		const { teamId, role, userId } = req.body;

		const member = await enhancedPrisma.teamMember.create({
			data: {
				teamId,
				userId,
				role,
			},
		});
		res.status(201).json(member);
	} catch (error) {
		res.status(500).json({ error: error });
	}
});

// PROJECT

app.get("/api/projects", async (req, res) => {
	try {
		const project = await enhancedPrisma.project.findMany({
			include: {
				team: true,
			},
		});
		res.status(201).json(project);
	} catch (error) {
		res.status(500).json({ error: error });
	}
});

app.post("/api/projects", async (req, res) => {
	try {
		const { status, type, access, teamId } = req.body;
		const project = await enhancedPrisma.project.create({
			data: {
				status,
				type,
				access,
				teamId,
			},
		});
		res.status(201).json(project);
	} catch (error) {
		res.status(500).json({ error: error });
	}
});

app.put("/api/projects/:id", async (req, res) => {
	try {
		const { status, type, access } = req.body;
		const project = await enhancedPrisma.project.update({
			where: { id: req.params.id },
			data: { status, type, access },
		});
		res.status(200).json(project);
	} catch (error) {
		res.status(500).json({ error: error });
	}
});

app.delete("/api/projects/:id", async (req, res) => {
	try {
		const project = await enhancedPrisma.project.delete({
			where: { id: req.params.id },
		});
		res.status(200).json(project);
	} catch (error) {
		res.status(500).json({ error: error });
	}
});

app.get("/api/projects/:id", async (req, res) => {
	try {
		const project = await enhancedPrisma.project.findUnique({
			where: { id: req.params.id },
			include: {
				team: {
					include: {
						members: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});
		res.status(200).json(project);
	} catch (error) {
		res.status(500).json({ error: error });
	}
});

app.listen(3000, () =>
	console.log(`
🚀 Server ready at: http://localhost:3000`),
);
