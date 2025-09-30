# UPSC Prep Portal

This is a Next.js web application designed as a comprehensive learning and test preparation platform for UPSC (Union Public Service Commission) aspirants. It leverages modern web technologies and generative AI to provide a dynamic and interactive study experience.

The application is built with a role-based architecture, providing distinct dashboards and functionalities for Students, Teachers, and Administrators.

---

## Core Features

- **AI-Powered Study Tools:** Users can get AI-generated summaries of PDF documents, create dynamic tests (MCQ and subjective), and generate flashcards on any topic.
- **Dynamic Test Generation:** Teachers and students can generate custom tests based on specific topics or uploaded documents, moving beyond static question banks.
- **Instant AI Evaluation:** Submitted tests are evaluated by an AI agent, providing immediate, detailed feedback, question-by-question explanations, and overall performance analysis.
- **Role-Based Dashboards:** The application provides tailored experiences for three distinct user roles:
    - **Student:** Can take assigned tests, review results, and use the AI prep tools for self-study.
    - **Teacher:** Can manage classes, create and assign tests, and review student submissions.
    - **Admin:** Has an overview of platform-wide statistics like user and test counts.
- **Secure Authentication:** User authentication and authorization are handled by Firebase Authentication, ensuring that users can only access the features appropriate for their role.
- **Real-Time Updates:** The platform uses Firestore's real-time capabilities to update test results and other data as soon as it becomes available, without requiring a page refresh.
