# Connect the local repository to GitHub

This folder already has a local Git repository and initial commit on `main`. No remote has been set and nothing has been uploaded.

Create an empty repository on your GitHub account. Leave the automatic README, licence and .gitignore options off because this project already has its own files and commit history. Choose the repository visibility you want.

Then, from this folder, using the URL of the empty repository you created:

```sh
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

The GitHub-ready ZIP is a source export and does not contain the local `.git` directory. Use the local project folder to retain the prepared history. If starting from the ZIP instead, initialise and commit it before adding the remote.

Build with `python scripts/build.py` before running the game. `dist/` is generated and ignored. Existing standalone working builds are also provided separately in the handoff.
