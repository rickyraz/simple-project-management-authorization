# Project Management System Documentation

## Overview
This system implements a team-based project management platform similar to:
- GitHub (repository & team management)
- Jira (project states & access control)
- Trello (board management)
- Notion (workspace & team collaboration)

## Database
Using SQLite with file storage at `./dev.db`

## Core Models

### Project
A project represents a workspace or repository that belongs to a team.

#### States
- **ACTIVE**: Ongoing projects
- **PRIVATE**: Internal/confidential projects
- **ARCHIVED**: Completed or inactive projects

#### Access Levels
- **OPEN**: Accessible to all team members
- **RESTRICTED**: Limited access
- **READ_ONLY**: View-only access (typically for archived projects)

#### Authorization Rules
- **Read**: Any team member
- **Create**: Only TEAM_LEADER
- **Update**:
  - ACTIVE projects: Any team member (if PUBLIC & OPEN)
  - PRIVATE projects: Any team member (if INTERNAL & RESTRICTED)
  - Archiving: Only TEAM_LEADER can change ACTIVE → ARCHIVED
- **Delete**: Only TEAM_LEADER (only ARCHIVED projects)
- **Project Secret**: Only visible to TEAM_LEADER

### Team
Represents a group of users working together.

#### Authorization Rules
- **Read**: Any authenticated user
- **Create**: Any authenticated user
- **Update**: Only TEAM_LEADER of the team

### Team Member
Links users to teams with specific roles.

#### Roles
- TEAM_LEADER
- MEMBER
- GUEST

#### Authorization Rules
- **Read**: Any authenticated user
- **Create**: 
  - ADMIN can create any member
  - Users can create themselves as TEAM_LEADER
- **Update/Delete**: Only ADMIN

### User
System user with role-based access.

#### Roles
- ADMIN: Full system access
- USER: Basic access

#### Authorization Rules
Currently allows all operations (temporary)

## Common Use Cases

### Project Lifecycle
1. TEAM_LEADER creates new project
2. Team members collaborate on ACTIVE projects
3. TEAM_LEADER can archive completed projects
4. Archived projects become READ_ONLY

### Team Management
1. Any authenticated user can create a team
2. Creator becomes TEAM_LEADER
3. TEAM_LEADER can manage team settings
4. Members can join existing teams

## Similar Systems
1. **GitHub**
   - Repository management
   - Team collaboration
   - Public/Private access
   - Archive functionality

2. **Jira**
   - Project states
   - Team management
   - Access control
   - Role-based permissions

3. **Trello**
   - Board management
   - Team collaboration
   - Archive functionality

4. **Notion**
   - Workspace management
   - Team collaboration
   - Access control

## Security Considerations
1. Role-based access control (RBAC)
2. Team-based permissions
3. Project state transitions
4. Secure project secrets
5. Member uniqueness per team

## Additional Models
The system also includes abstract animal models (Hewan, Kucing, Anjing) which appear to be separate from the main project management functionality.