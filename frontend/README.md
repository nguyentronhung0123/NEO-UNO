# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.



















Directory structure:
└── nguyentronhung0123-neo-uno/
    ├── backend/
    │   ├── package.json
    │   ├── server.js
    │   ├── controllers/
    │   │   └── authController.js
    │   ├── data/
    │   │   └── mockUsers.js
    │   └── routes/
    │       └── authRoutes.js
    └── frontend/
        ├── README.md
        ├── index.html
        ├── package.json
        ├── postcss.config.js
        ├── tailwind.config.js
        ├── vercel.json
        ├── vite.config.js
        ├── .oxlintrc.json
        └── src/
            ├── App.css
            ├── App.jsx
            ├── index.css
            ├── main.jsx
            ├── apis/
            │   └── authApi.js
            ├── constants/
            │   └── gameConstants.js
            ├── contexts/
            │   └── AuthContext.jsx
            ├── features/
            │   └── auth/
            │       ├── index.js
            │       ├── components/
            │       │   ├── AuthBackground.jsx
            │       │   ├── AuthCard.jsx
            │       │   ├── AuthTabs.jsx
            │       │   ├── ServerStatusBadge.jsx
            │       │   ├── SocialLoginButtons.jsx
            │       │   ├── TermsModal.jsx
            │       │   └── UnoCardBadge.jsx
            │       └── helpers/
            │           └── authValidation.js
            ├── helpers/
            │   └── cardHelpers.js
            ├── hooks/
            │   └── useAuth.js
            └── pages/
                └── AuthPage.jsx
