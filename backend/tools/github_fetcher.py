# backend/tools/github_fetcher.py
import httpx
import os
from typing import Dict, List, Any

# Exclude common config, asset, and compiled files
EXCLUDE_EXTENSIONS = {
    '.md', '.json', '.yaml', '.yml', '.txt', '.csv',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.lock', '.gitignore', '.env', '.pyc', '.pyo'
}

async def fetch_github_repo_context(username: str, repo: str) -> Dict[str, Any]:
    """
    Fetches the repository tree using GitHub REST API v3 and retrieves
    the raw content of the top 3-5 source files for LLM context.
    """
    headers = {"Accept": "application/vnd.github.v3+json"}

    # Optional: Use a GitHub token if rate limits become an issue
    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    base_url = f"https://api.github.com/repos/{username}/{repo}"

    async with httpx.AsyncClient(headers=headers) as client:
        # 1. Check default branch
        repo_info_res = await client.get(base_url)
        if repo_info_res.status_code != 200:
            raise Exception(f"Failed to find repository {username}/{repo}. Status: {repo_info_res.status_code}")

        default_branch = repo_info_res.json().get("default_branch", "main")

        # 2. Get file tree
        tree_url = f"{base_url}/git/trees/{default_branch}?recursive=1"
        tree_res = await client.get(tree_url)

        if tree_res.status_code == 409:
            raise Exception(
                "This GitHub repository is completely empty. Please provide a repository that contains code.")
        elif tree_res.status_code != 200:
            raise Exception(f"Failed to fetch repository tree. Status: {tree_res.status_code}")

        tree_data = tree_res.json().get("tree", [])

        # 3. Filter for source files
        source_files = []
        for item in tree_data:
            if item["type"] == "blob":
                filepath = item["path"]
                ext = os.path.splitext(filepath)[1].lower()

                # Skip excluded extensions, hidden directories, and lockfiles
                if ext not in EXCLUDE_EXTENSIONS and "/." not in filepath and "lock" not in filepath:
                    source_files.append(item)

        # 4. Grab top 5 files (prioritizing source code over deep nested files)
        # Sort by depth (fewer slashes = root level usually more important for entry points)
        source_files.sort(key=lambda x: x["path"].count("/"))
        top_files = source_files[:5]

        # 5. Fetch raw content for these top files
        file_contents = {}
        for file_item in top_files:
            filepath = file_item["path"]
            raw_url = f"https://raw.githubusercontent.com/{username}/{repo}/{default_branch}/{filepath}"
            raw_res = await client.get(raw_url)
            if raw_res.status_code == 200:
                file_contents[filepath] = raw_res.text[:3000] # Cap length to avoid token overflow

        # Format tree for context (just the paths)
        tree_paths = [item["path"] for item in tree_data if item["type"] == "blob"]

        return {
            "default_branch": default_branch,
            "tree": tree_paths,
            "file_contents": file_contents
        }