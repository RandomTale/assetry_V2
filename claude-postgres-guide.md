Sure! Here's a step by step guide for installing PostgreSQL 16 on Windows.

## 1. Download the Installer

Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) and click **Download the installer** then download the **16.x** version for Windows x86-64.

---

## 2. Run the Installer

Open the downloaded `.exe` file and go through the setup:

- **Installation Directory** — leave it as default
- **Select Components** — keep all checked, make sure these are selected:
  - PostgreSQL Server
  - pgAdmin 4
  - Command Line Tools
- **Data Directory** — leave as default
- **Password** — set a password for the `postgres` user, **remember this**, you'll need it in your `.env` file
- **Port** — leave as `5432`
- **Locale** — leave as default
- **Stack Builder** — uncheck this at the end, you don't need it

---

## 3. Add PostgreSQL to PATH

After installing you need to be able to run `psql` from your terminal. To do this:

1. Press `Windows + S` and search **Environment Variables**
2. Click **Edit the system environment variables**
3. Click **Environment Variables**
4. Under **System Variables** find **Path** and click **Edit**
5. Click **New** and add this path:
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```
6. Click **OK** on all windows

---

## 4. Verify the Installation

Open a **new** terminal window and run:
```bash
psql --version
```

It should print:
```
psql (PostgreSQL) 16.x
```

Then test you can connect:
```bash
psql -U postgres
```

It will ask for the password you set during installation. Once connected you'll see:
```
postgres=#
```

Type `\q` to exit.

---

## 5. Create the Assetry Database

Once connected or directly from terminal run:
```bash
psql -U postgres -c "CREATE DATABASE assetry;"
```

Verify it was created:
```bash
psql -U postgres -c "\l"
```

You should see `assetry` in the list of databases.

---

After this is done, update your `server/.env` file with the password you set:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/assetry"
```

Replace `yourpassword` with the actual password you chose during installation. Let me know once this is done and we'll continue with the rest of the setup!