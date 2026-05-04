# Adele TRE

This project is a containerized full-stack web application built with:

- **Angular** (Frontend)
- **Flask** (Backend)
- **MongoDB** (Database)
- **Docker Compose** (Orchestration)

---

## Getting Started (Deployment)

### Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Quick Start

### Adele-Website Development
1. **Clone the repository:**

    ```bash
    git clone https://github.com/martafelix13/Adele-Backoffice.git
    cd Adele-Backoffice
    ```



2. **Build and start all services:**

    ```bash
    docker compose up --build
    ```

3. **Access the Adele Backoffice app:**
    - Frontend: [http://localhost:4300](http://localhost:4300)
    - Backend API: [http://localhost:8081](http://localhost:8081)

   **Adele-Website app:**
    - Frontend: [http://localhost:4200](http://localhost:4200)
    - Backend API: [http://localhost:8080](http://localhost:8080)

    These are the pre-defined user accounts available after deployment. Each role has specific authorizations:

    | Role              |  Username | Authorizations                                                         |
    |-------------------|-----------|------------------------------------------------------------------------|
    | ADMIN             |  admin    | Full access: manage users, settings, and all data                      |
    | TRE-OPERATOR      |  operator | Manage and review the projects, validate legal documents and metadata  |
    | OUTPUT-VALIDATOR  | validator | Validate output after task completion                                  |

     Passwords are securely hashed in the database. Default passwords are:
     - admin: admin123
     - operator: operator123
     - validator: validator123
     Change passwords in production for security.

### Adele-Website Development

To run the Adele-Website frontend locally:

```bash
cd Adele-Website/TRE-BIODATA
npm install
ng serve
```

Visit [http://localhost:4200](http://localhost:4200) in your browser.

To run the Adele-Website backend locally:

```bash
cd Adele-Website/backend
pip install -r requirements.txt
python server.py
```

The API will be available at [http://localhost:8080](http://localhost:8080).

### Adele-Backoffice Backend Development

To run the Flask backend locally:

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The API will be available at [http://localhost:8081](http://localhost:8081).

---

## Global Docker Compose Setup

To run both Adele-Backoffice and Adele-Website together, with MongoDB and shared documents:

1. Make sure your `.env` file is set up with all required variables for both projects.
2. Use the provided `docker-compose.yml` (in the project root) which includes services for:
    - `adele-backoffice-frontend` (Angular + Nginx)
    - `adele-backoffice-backend` (Flask)
    - `adele-website-frontend` (Angular + Nginx)
    - `adele-website-backend` (Flask)
    - `mongodb` (MongoDB)
    - `tre-shared-documents` (shared volume)

3. Build and start all services:
    ```bash
    docker compose up --build
    ```

4. Access the apps at the URLs above.

---


## Troubleshooting & Notes

- Default credentials are listed above.
- If you change ports or environment variables, update them in `.env` files and `docker-compose.yml`.
- For troubleshooting, check logs with:
  ```bash
  docker compose logs
  ```

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

Enjoy using Adele!
