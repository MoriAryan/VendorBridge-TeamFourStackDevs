Here is the complete reverse-engineered engineering playbook from the `chai-backend` repository (https://github.com/hiteshchoudhary/chai-backend). This covers the mindset, workflow, and strict standards required to build professional-grade backends, perfectly suited for graduating from BaaS (like Firebase/Supabase) to a robust, scalable MERN architecture for unified platforms like NextEventNow.

### **Output 1: REPOSITORY_EVOLUTION.md**

# REPOSITORY_EVOLUTION.md

## Phase 1: Foundational Tooling & Environment
* **What was built:** Initialization of `package.json`, Git ignore files, `.env.sample`, and strict formatting configurations (`.prettierrc`, `.prettierignore`).
* **Why it was built:** Before writing a single line of application logic, professional environments lock down formatting and environment secrets. This prevents "it works on my machine" issues and messy Git histories filled with formatting wars.
* **Lessons learned:** Never start coding without establishing the rules of the repository. `.env.sample` acts as living documentation for required environment variables.

## Phase 2: App & Server Decoupling
* **What was built:** The creation of `src/index.js` (Server startup & DB connection) and `src/app.js` (Express configuration).
* **Why it was built:** Decoupling the Express application from the network server allows for isolated testing (you can test the Express app without binding it to a port) and creates a separation of concerns. 
* **Lessons learned:** `app.js` is for middleware and route mounting. `index.js` is the entry point that initializes external resources (like the DB) before starting the server. 

## Phase 3: The Utility Standardization
* **What was built:** `src/utils/ApiError.js`, `src/utils/ApiResponse.js`, and `src/utils/asyncHandler.js`.
* **Why it was built:** To eliminate repetitive `try/catch` blocks in controllers and ensure a uniform contract for frontend clients. If every developer writes their own JSON response format, the frontend team suffers.
* **Lessons learned:** Build your error and response wrappers first. `asyncHandler` acts as a higher-order function that catches async promise rejections and passes them to the Express error middleware automatically.

## Phase 4: Third-Party Service Abstraction
* **What was built:** `src/utils/cloudinary.js` and `src/middlewares/multer.middleware.js`.
* **Why it was built:** The architecture uses a two-step upload process: Multer intercepts the file from the request and saves it temporarily to local disk (`public/temp`). Cloudinary utility then uploads the local file to the cloud and deletes the local copy.
* **Lessons learned:** Never upload directly from memory to cloud if the file is large; chunking via local disk prevents server RAM exhaustion. Always clean up local files in a `finally` block or after successful cloud upload.

## Phase 5: Data Modeling & Business Rules
* **What was built:** `src/models/user.model.js` and `src/models/video.model.js`. Implementation of Mongoose `pre('save')` hooks and instance methods.
* **Why it was built:** Business logic related to data integrity (like password hashing) should live in the model, not the controller. 
* **Lessons learned:** Fat models, skinny controllers. Password hashing and JWT generation belong inside the schema definitions using `methods` and `pre` hooks, keeping the authentication controller purely focused on orchestrating the request.

## Phase 6: Authentication & Security Flow
* **What was built:** User controllers (`registerUser`, `loginUser`, `logoutUser`, `refreshAccessToken`). Secure cookie handling.
* **Why it was built:** To implement stateless authentication with high security. The backend generates both an Access Token (short-lived) and a Refresh Token (long-lived, saved in DB). Both are sent to the client via `httpOnly`, `secure` cookies.
* **Lessons learned:** `httpOnly` cookies prevent XSS attacks from stealing tokens. The Refresh token rotation strategy provides the best balance of UX (user stays logged in) and security (stolen access tokens expire quickly).

## Phase 7: Middleware Injection
* **What was built:** `src/middlewares/auth.middleware.js`.
* **Why it was built:** To protect routes by verifying the incoming JWT token, querying the database for the user, and attaching the `req.user` object for downstream controllers to utilize.
* **Lessons learned:** Middleware should be pure and focused. It does one job (e.g., verifying identity) and enriches the request object so the actual controller doesn't have to duplicate auth logic.

## Phase 8: Complex Data Retrieval (Aggregation Pipelines)
* **What was built:** Advanced controllers for subscriptions, likes, and comments using Mongoose Aggregation pipelines (`$match`, `$lookup`, `$addFields`, `$project`).
* **Why it was built:** Standard `find()` or `.populate()` queries become extremely slow and resource-heavy for complex relational queries (e.g., fetching a video, its owner, its total likes, and whether the current user is subscribed).
* **Lessons learned:** Move heavy data transformations to the database layer. MongoDB aggregations are drastically faster than fetching separate collections and joining them in Node.js memory.

```

---

### **Output 2: BACKEND_BLUEPRINT.md**

```markdown
# BACKEND_BLUEPRINT.md

## 1. Project Structure
```text
src/
├── app.js               # Express app config, global middlewares, route mounting
├── index.js             # Entry point, DB connection, Server listener
├── constants.js         # Application-wide constants (DB name, enums)
├── db/                  # Database connection logic
├── models/              # Mongoose schemas
├── controllers/         # Request handling and orchestration
├── routes/              # Route definitions and middleware mapping
├── middlewares/         # Interceptors (Auth, Multer)
└── utils/               # Reusable helpers (Cloudinary, ApiError, ApiResponse)

```

## 2. Controller Standards

* Controllers **must not** contain `.catch()` blocks. They must be wrapped in `asyncHandler`.
* Controllers **must** extract inputs explicitly from `req.body`, `req.params`, or `req.query`.
* Controllers **must** validate inputs and immediately throw an `ApiError` if missing.
* Controllers **must** return data using `res.status(code).json(new ApiResponse(...))`.

## 3. Route Standards

* Routes must be segregated by feature (e.g., `user.routes.js`).
* Routes must use Express Router: `const router = Router();`
* Routes must group identical endpoints using `.route()`:
`router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);`
* API versioning must be done at the mount point in `app.js`: `app.use("/api/v1/users", userRouter);`

## 4. Model Standards

* Schemas must always include `{ timestamps: true }`.
* Sensitive data (passwords) must use `select: false` by default, or be explicitly omitted in aggregations.
* Use `pre('save')` hooks for hashing passwords. Always check `if(!this.isModified("password")) return next();`.
* JWT logic (`generateAccessToken`, `generateRefreshToken`) must exist as schema `.methods`.

## 5. Middleware Standards

* Middleware must accept `(req, res, next)`.
* Authentication middleware must retrieve tokens from either `req.cookies` or `req.header("Authorization")?.replace("Bearer ", "")`.
* Upon successful validation, middleware must attach data to `req` (e.g., `req.user = user`) and call `next()`.
* Must throw `ApiError` via `next(new ApiError(...))` on failure.

## 6. Authentication Standards

* **Access Tokens:** Short expiry (e.g., 1d), contains user ID and basic non-sensitive info, not stored in DB.
* **Refresh Tokens:** Long expiry (e.g., 10d), contains only user ID, hashed and stored in DB for revoking access.
* **Cookies:** Tokens must be sent via `res.cookie(name, token, { httpOnly: true, secure: true })` to prevent client-side JS access.

## 7. Error & Response Standards

* **ApiError:** Must extend native `Error`. Must include `statusCode`, `message`, `errors` array, and `success: false`.
* **ApiResponse:** Must be a class containing `statusCode`, `data`, `message`, and `success: true`.

## 8. Database Standards

* Use `mongoose-aggregate-paginate-v2` plugin for pagination on heavy queries.
* Use MongoDB native `$lookup` instead of Mongoose `.populate()` for scale.
* Connection logic must be wrapped in an async function and invoked from `index.js`, handling `process.exit(1)` on connection failure.


***

### **Output 3: AI_RULES.md**

# AI_RULES.md (Backend Architecture Directives)

You are an expert MERN Stack AI architect. When generating backend code for this repository, you must strictly adhere to the following rules:

1. **ALWAYS** wrap every asynchronous controller function in the `asyncHandler` utility. Never use standard `try/catch` inside a route controller unless specifically required for a localized fallback.
2. **ALWAYS** return HTTP responses using the `ApiResponse` class. Example: `return res.status(200).json(new ApiResponse(200, data, "Message"));`
3. **ALWAYS** throw errors using the `ApiError` class. Example: `throw new ApiError(404, "User not found");`
4. **ALWAYS** destructure required fields from `req.body` at the top of the controller and perform immediate validation.
5. **NEVER** write raw `res.send()` or `res.json()`.
6. **NEVER** handle database connections in `app.js`. `app.js` is exclusively for Express middlewares (`cors`, `express.json`, `cookie-parser`) and route mounting.
7. **NEVER** store JWT generation logic in controllers. It must exist in the Mongoose schema methods (`userSchema.methods.generateAccessToken`).
8. **ALWAYS** hash passwords using `bcrypt` inside a `pre('save')` Mongoose hook. Never hash passwords in the controller.
9. **PREFER** MongoDB `$lookup` aggregation pipelines over Mongoose `.populate()` for fetching related documents.
10. **ALWAYS** use `httpOnly: true` and `secure: true` when setting authentication cookies.
11. **ALWAYS** mount routes with API versioning (e.g., `/api/v1/resource`).
12. **NEVER** upload files directly to cloud storage from memory. Route files through `multer` to local storage, upload to cloud, and use Node `fs.unlinkSync` to remove the local file securely.


---

### **Output 4: ARCHITECTURE_CHECKLIST.md**

# ARCHITECTURE_CHECKLIST.md

## Repository & Environment Setup
- [ ] `.env` variables mapped correctly in a `.env.sample` file.
- [ ] Global constants (like DB name) stored in `src/constants.js`.
- [ ] `prettierrc` and `prettierignore` configured.

## Architecture & Bootstrapping
- [ ] DB connection isolated in `src/db/index.js` utilizing async/await.
- [ ] `app.js` configured with `cors`, `cookie-parser`, `express.json`, and `express.urlencoded`.
- [ ] Server instantiated in `src/index.js` strictly *after* DB connection resolves.

## Error & Response Uniformity
- [ ] `ApiError` class utilized for all rejections.
- [ ] `ApiResponse` class utilized for all successful data deliveries.
- [ ] `asyncHandler` wrapper applied to all controller functions.

## Authentication & Security
- [ ] Access Token and Refresh Token logic separated.
- [ ] Passwords hashed via Mongoose pre-save hooks, not in controllers.
- [ ] Auth middleware extracts token from both Cookies and Authorization Headers.
- [ ] Tokens set dynamically in cookies using `httpOnly` and `secure` flags.
- [ ] Logout mechanism successfully unsets cookies and invalidates DB refresh token.

## Routing & Controllers
- [ ] Routes utilize `router.route().method()` syntax.
- [ ] Controllers contain zero business logic for hashing/token-generation.
- [ ] Multer middleware injected specifically on routes requiring file uploads.
- [ ] Heavy database querying shifted to aggregation pipelines.



---

### **Final Requirement: The Architecture Playbook**

#### **Top 20 Engineering Lessons**

1. **Separation of Concerns:** Keep your server listener (`index.js`) and app config (`app.js`) strictly separate.
2. **Centralized Error Handling:** Standardized error formats prevent frontend chaos.
3. **Stateless Scalability:** Store refresh tokens in the DB, but keep access tokens stateless.
4. **Fat Models / Skinny Controllers:** Models dictate data behavior (hashing, tokens); controllers just orchestrate the request.
5. **Two-Step File Uploads:** Always buffer files on the local disk before sending to external APIs to prevent memory leaks.
6. **Async Wrappers:** Custom async wrappers eliminate the visual clutter of repetitive try-catch blocks.
7. **Graceful DB Failures:** If the DB doesn't connect, kill the Node process `process.exit(1)`. An app without its DB is a zombie.
8. **Cookie-Parser is Mandatory:** Secure your auth flow by reading and writing HTTP-only cookies.
9. **CORS Rigidity:** Explicitly define your CORS origins; wildcard `*` is a security liability in production.
10. **Data Pagination at the DB Layer:** Never fetch all records and slice them in JS; use aggregation pagination.
11. **Model Method Abstraction:** `user.isPasswordCorrect(req.body.password)` is infinitely cleaner than writing bcrypt logic in the controller.
12. **MongoDB Aggregations:** Mastering `$lookup`, `$project`, and `$unwind` is non-negotiable for real-world backend engineering.
13. **Pre-Save Hooks:** Automate data transformations (like hashing) right before they hit the DB.
14. **The "Modified" Check:** In pre-save hooks, always check if the specific field was modified before hashing to avoid re-hashing an already hashed password on unrelated document updates.
15. **Constant Files:** Hardcoding strings (like DB names or error messages) creates maintenance nightmares. Use a `constants.js` file.
16. **Route Grouping:** Use `router.route()` to bundle GET/POST/PATCH methods for the same URI.
17. **Early Returns:** Validate data immediately at the top of the controller and return early to flatten code execution paths.
18. **Index Management:** Add `index: true` to mongoose schema fields you plan to search by (like username or email) for faster querying.
19. **Cleanup Routines:** If a cloud upload fails, make sure your utility function deletes the local corrupted file anyway.
20. **Versioned APIs:** Always prefix routes with `/api/v1/` to ensure future backward compatibility.

#### **Top 20 Mistakes Beginners Make (That this repo avoids)**

1. Writing massive `app.js` files with inline routes and database logic.
2. Sprinkling raw `res.status(400).json({ error: "bad data"})` everywhere.
3. Hashing passwords directly inside the registration controller.
4. Saving Access Tokens directly to LocalStorage on the frontend (XSS vulnerability).
5. Using `.populate()` for multi-layered nested queries, causing immense memory drag.
6. Uploading directly from the request stream to Cloudinary, risking memory overflow.
7. Using generic `Error` classes that don't pass HTTP status codes to the error handler.
8. Forgetting to wrap asynchronous controllers, causing unhandled promise rejections that crash the server.
9. Not awaiting database calls.
10. Hardcoding environment variables inside the codebase.
11. Failing to clean up local temporary files after an API upload.
12. Not clearing cookies during the logout flow.
13. Creating chaotic folder structures that don't separate routes from controllers.
14. Trusting incoming `req.body` data without validation.
15. Updating a user document (like changing their avatar) and accidentally triggering a re-hash of their already-hashed password.
16. Throwing 500 errors for user-side mistakes (like missing fields) instead of 400 Bad Request.
17. Allowing wildcard CORS on authenticated APIs.
18. Keeping the Refresh Token expiry the same as the Access Token expiry (defeating the purpose).
19. Returning sensitive data (like the hashed password) in the API response after registration.
20. Not setting up Prettier/ESLint, leading to broken Git histories from formatting changes.

#### **The 80/20 Rule of this Repository**

The 20% of practices that produce 80% of the repository's professional feel:

1. **The Utility Trio:** Using `ApiResponse`, `ApiError`, and `asyncHandler` instantly upgrades codebase readability by 80%.
2. **Schema-Level Logic:** Moving auth logic (jwt, bcrypt) into Mongoose models drastically simplifies controllers.
3. **Cookie-Based JWT Rotation:** Implementing the Access/Refresh token pattern via HTTP-only cookies solves the majority of security architecture concerns.

#### **The Learning Roadmap (For a MERN Migration)**

If you are moving a unified platform (like NextEventNow) away from Firebase/Supabase into a custom full-stack MERN architecture, follow this exact mastery path:

* **Step 1: The App & DB Shell.** Master how Express connects to MongoDB via Mongoose. Understand the separation between `app.js` and `db/index.js`.
* **Step 2: The Utility Contract.** Build `ApiError`, `ApiResponse`, and `asyncHandler`. Understand exactly *why* higher-order functions work in Express.
* **Step 3: Advanced Mongoose Modeling.** Don't just build schemas. Learn how to write `pre('save')` hooks for bcrypt and instance `.methods` for JWT. This replaces the "auth out of the box" you get with BaaS.
* **Step 4: The Token Architecture.** Master the dual-token system. Learn how to generate, send, and clear `httpOnly` cookies. Understand the `/refresh-token` endpoint logic deeply.
* **Step 5: Middleware Interception.** Build the `auth.middleware.js` to decode JWTs, fetch the user, and pass it forward. This mimics Firebase's request context.
* **Step 6: File Handling.** Master `multer` and `fs`. Learn how to intercept a file, write it locally, push it to a cloud provider, and wipe the local copy.
* **Step 7: Aggregation Pipelines.** This is the hardest but most crucial step. Move away from Firebase's basic queries and learn MongoDB aggregation (`$match`, `$lookup`, `$project`) to build complex, relational views (e.g., getting an event, its creator, and the total attendee count in one single database query).