# Phase 5 Final project: Group 6 Spacer Booking app

A full stack web application for booking and managing workspaces, event spaces, and other rentable locations. Built with **Flask** and **React**, Spacer provides a seamless experience for both space owners and renters.

## 🌟 Features

### For Users

- **Browse Spaces**: Discover available spaces with detailed descriptions, photos, and amenities
- **Advanced Search**: Filter spaces by price, capacity, and amenities
- **Booking System**: Easy-to-use booking interface with date/time selection
- **Reviews & Ratings**: Read and write reviews for spaces you've visited
- **User Dashboard**: Manage your bookings, reviews, and profile

### For Space Owners

- **Space Management**: Create and manage your space listings
- **Booking Overview**: Track incoming bookings and reservations
- **Financial Dashboard**: Monitor revenue and invoice generation
- **Analytics**: View booking trends and space performance

### For Administrators

- **User Management**: Manage user accounts and permissions
- **Booking Oversight**: Monitor all bookings across the platform
- **Review Moderation**: Manage user reviews and ratings

## 🌐 Live Demo

Check out the deployed application:

- **Frontend**: [https://phase-5-group-6-spacer-1.onrender.com/](https://phase-5-group-6-spacer-1.onrender.com/)
- **Backend API**: [https://phase-5-group-6-spacer.onrender.com/](https://phase-5-group-6-spacer.onrender.com/)

## 🛠️ Tech Stack

### Backend

- **Flask**: Python web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Relational database
- **Flask-JWT-Extended**: Authentication and authorization
- **Flask-CORS**: Cross-origin resource sharing
- **Flask-Migrate**: Database migrations
- **Pipenv**: Python dependency management

### Frontend

- **React**: UI library
- **React Router**: Client-side routing
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework
- **Context API**: State management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.8 or higher
- Pipenv
- Node.js 14 or higher
- PostgreSQL 12 or higher
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:Valentine101098/Phase-5-Group-6-Spacer.git

cd Phase-5-Group-6-Spacer
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd server
pipenv install
```

This will create a virtual environment and install all dependencies from the Pipfile.

#### Activate Virtual Environment

```bash
pipenv shell
```

#### Set Up Database

#### Step 1: Create the PostgreSQL database

```bash
# Create the database
createdb spacer_db
```

This creates an empty PostgreSQL database named `spacer_db`.

#### Step 2: Run migrations

```bash
pipenv run flask db init
pipenv run flask db migrate -m "Initial migration"
pipenv run flask db upgrade
```

#### Step 3: Seed database with sample data

```bash
pipenv run python seed.py
```

#### Start the Backend Server

```bash
pipenv run flask run
```

The backend will run on `http://127.0.0.1:5000`

### 3. Frontend Setup

Open a new terminal window:

```bash
cd client

npm install
```

#### Start the Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔄 Development Workflow

### Git Flow

This project uses Git Flow for branch management:

```bash
# Create a new feature
git flow feature start feature-name

# Finish a feature
git flow feature finish feature-name

# Create a bugfix
git flow bugfix start hotfix-name

# Create a hotfix
git flow hotfix start hotfix-name


# Finish a hotfix
git flow hotfix finish hotfix-name
```

### Branch Naming Convention

- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### CI/CD Implementation

This project uses GitHub Actions for continuous integration and continuous deployment. Our CI/CD pipeline automatically tests, builds, and deploys code changes to ensure quality and reliability.

### Branch Protection Rules

Main and development branches have the following protection rules:

1. Require pull request reviews before merging - at least 2 reviewers
2. Require status checks to pass before merging
3. Require branches to be up to date before merging
4. Required status checks:

    - Backend CI / test
    - Frontend CI / test

## 🧪 Testing

### Backend Tests

```bash
cd server
pipenv shell
pytest
```

### Frontend Tests

```bash
cd client
npm test
```

## 🤝 Contributing

### Contribution Guidelines

1. Create a feature branch from `development`
2. Make your changes
3. Write/update tests
4. Submit a pull request
5. Wait for code review
6. Merge after approval

### 👨‍💻 Contributors/Developers

- *Valentine Wanjiru*
- *Douglas Gatimu*
- *Antony Omondi*
- *Victor Kimathi*

## License

This project is licensed under the [MIT License](./LICENSE)