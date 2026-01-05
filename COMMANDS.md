# Useful Developer Commands

Here are the commands used to build, run, and manage the Perplexica project with your custom modifications.

## Docker Commands

### 1. Build and Run (First Time or After Changes)
If you have modified the source code, you must rebuild the image.

**Option A: Using Docker Compose (Recommended)**
This builds the image locally and starts the service in detached mode.
```powershell
docker compose up --build -d
```

**Option B: Manual Build**
Use this if you want to manually tag the image or run specific run flags.

1. **Stop & Remove Old Container**
   ```powershell
   docker stop perplexica-container
   docker rm perplexica-container
   ```

2. **Build the Image**
   ```powershell
   docker build -t perplexica:local .
   ```

3. **Run the Container**
   ```powershell
   docker run -d `
     --name perplexica-container `
     -p 3000:3000 `
     -v perplexica-data:/home/perplexica/data `
     perplexica:local
   ```

### 2. View Logs
To see what the application is doing (especially useful for debugging LLM errors):
```powershell
docker logs -f perplexica-container
# OR if using compose
docker compose logs -f perplexica
```

### 3. Stop Application
```powershell
docker stop perplexica-container
# OR if using compose
docker compose down
```

---

## Git Commands

### 1. Basic Workflow
These commands are used to save your work locally.

```bash
# check what files changed
git status

# stage changes
git add . 

# commit changes
git commit -m "feat: description of your change"
```

### 2. Working with Branches
It is best practice to work on feature branches.

```bash
# create and switch to a new branch
git checkout -b feature/my-new-feature

# merge changes back to master
git checkout master
git merge feature/my-new-feature
```

### 3. Syncing with GitHub Fork
You have forked the repository to `adityaagarw/Perplexica`.

```bash
# push changes to your fork
git push my-fork master

# pull latest changes from your fork (if you edited on github directly)
git pull my-fork master --rebase
```

### 4. Syncing with Original Repo (Upstream)
If the original author updates their code, you can pull it into yours.

```bash
# Add original repo as upstream
git remote add upstream https://github.com/ItzCrazyKns/Perplexica.git

# Fetch and merge updates
git fetch upstream
git merge upstream/master
```
