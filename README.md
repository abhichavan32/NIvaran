# CivicAI – Crowd-Sourced Civic Issue Resolution System

A full-stack web application that allows citizens to report civic issues (potholes, garbage, water leakage, streetlight problems), track them, and enables authorities to resolve them efficiently using AI-powered prioritization and classification.

## Features

### User Module (Citizens)
- User registration & JWT authentication
- Report issues with title, description, category, image, GPS location
- AI auto-classifies issue category
- View issue status (Pending, In Progress, Resolved)
- Upvote similar issues
- Comment on issues
- Real-time notification system

### AI Features
- **Auto Classification**: NLP keyword-based classification into 10 categories
- **Priority Scoring**: Based on severity keywords, upvote count, and text analysis
- **Duplicate Detection**: Jaccard similarity + Haversine distance for location-aware matching
- **Chatbot Assistant**: Rule-based chatbot to help users report issues

### Admin Module (Super Admin)
- Dashboard with analytics (charts, graphs)
- Category distribution (Bar + Pie charts)
- Monthly trend analysis (Line chart)
- Manage all users
- Assign issues to Area Admins
- Export reports as CSV
- View map with issue clustering

### Area Admin Module
- View assigned issues
- Update issue status
- Add resolution notes
- Upload resolution proof images

### Additional Features
- Map integration (OpenStreetMap/Leaflet)
- Color-coded markers by status
- Search & filter issues
- Pagination
- Role-based access control (RBAC)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) |
| Backend | Django REST Framework |
| Database | SQLite (dev) |
| AI/ML | Python (keyword NLP, Jaccard similarity) |
| Maps | Leaflet.js + OpenStreetMap |
| Auth | JWT (SimpleJWT) |
| Charts | Recharts |
| API Docs | Swagger (drf-yasg) |

## Project Structure

```
civicai/
├── backend/
│   ├── civicai/           # Django project settings
│   ├── users/             # Auth & user management
│   ├── issues/            # Issue CRUD, comments, votes
│   ├── ai_engine/         # AI classifier, chatbot
│   ├── notifications/     # Notification system
│   ├── media/             # Uploaded images
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, Chatbot
│   │   ├── pages/         # All page components
│   │   ├── services/      # API service (axios)
│   │   └── context/       # Auth context
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Load sample data
python manage.py seed_data

# Start server
python manage.py runserver
```

Backend runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | admin123 |
| Area Admin | areaadmin | admin123 |
| User | demouser | user123 |

## API Documentation

Swagger UI: http://localhost:8000/swagger/
ReDoc: http://localhost:8000/redoc/

### Key API Endpoints

#### Authentication
- `POST /api/users/login/` - Login (JWT)
- `POST /api/users/register/` - Register
- `GET /api/users/profile/` - Get profile
- `POST /api/users/token/refresh/` - Refresh token

#### Issues
- `GET /api/issues/` - List issues (with filters)
- `POST /api/issues/create/` - Create issue
- `GET /api/issues/{id}/` - Issue details
- `PATCH /api/issues/{id}/update/` - Update issue
- `POST /api/issues/{id}/vote/` - Upvote issue
- `POST /api/issues/{id}/assign/` - Assign to admin
- `GET/POST /api/issues/{id}/comments/` - Comments
- `GET /api/issues/map/` - Map data
- `POST /api/issues/similar/` - Find similar issues
- `POST /api/issues/chatbot/` - AI chatbot
- `GET /api/issues/export/` - Export CSV

#### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/read/` - Mark read
- `GET /api/notifications/unread-count/` - Unread count

## Database Schema

### Users Table
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| username | CharField | Unique username |
| email | EmailField | User email |
| role | CharField | user / area_admin / super_admin |
| phone | CharField | Phone number |
| area | CharField | User's area |

### Issues Table
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| title | CharField | Issue title |
| description | TextField | Detailed description |
| category | CharField | Issue category |
| ai_category | CharField | AI-predicted category |
| status | CharField | pending / in_progress / resolved |
| priority | CharField | low / medium / high / critical |
| priority_score | FloatField | AI priority score (0-1) |
| reporter | ForeignKey | Reporting user |
| assigned_to | ForeignKey | Assigned area admin |
| latitude | FloatField | GPS latitude |
| longitude | FloatField | GPS longitude |
| image | ImageField | Issue photo |

## AI/ML Details

### Classification Algorithm
- Keyword-based NLP matching with weighted scoring
- 10 categories with curated keyword lists
- Multi-word keyword matching for higher accuracy

### Priority Scoring (0-1 scale)
- High severity keywords: +0.15 each (max 0.6)
- Medium severity keywords: +0.08 each (max 0.3)
- Upvote bonus: logarithmic scaling (max 0.2)
- Text length bonus: +0.05 for 50+ words

### Duplicate Detection
- Jaccard text similarity on filtered words
- Haversine location proximity bonus
- Combined threshold: 0.3
