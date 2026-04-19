# 🎓 Student Management System

A full-stack web application designed to manage student data, attendance, assignments, and academic records with separate dashboards for students and faculty.

---

## 🚀 Features

* 🔐 User Authentication (Student & Faculty)
* 📊 Role-Based Dashboards
* ✅ Attendance Management
* 📝 Assignments Tracking
* 📢 Notices & Announcements
* 📈 Grades Management
* 👨‍🏫 Faculty Control Panel

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* JSON-based local database (`data.json`)

---

## 📂 Project Structure

```
student-management-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── db.js
│   ├── data.json
│   └── server files
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/student-management-system.git
```

### 2. Setup Backend

```bash
cd backend
npm install
npm start
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Default Credentials

* **Student Email:** [corestudent1@school.edu](mailto:corestudent1@school.edu)
* **Password:** 1234

> You can modify users in `backend/data.json`

---

## 📦 Database Info

This project uses a lightweight JSON file (`data.json`) instead of a traditional database.

It stores:

* Users
* Students
* Faculty
* Subjects
* Attendance
* Assignments
* Notices
* Grades

---

## 📌 Notes

* `node_modules/` is excluded from the repository
* `.env` files are not uploaded for security reasons
* This project is built for learning/demo purposes

---

## 📈 Future Improvements

* MySQL / MongoDB integration
* JWT Authentication
* Deployment (Vercel / Render)
* Mobile responsiveness

---

## 👩‍💻 Author

**Nitheesha Ramireddy**

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
