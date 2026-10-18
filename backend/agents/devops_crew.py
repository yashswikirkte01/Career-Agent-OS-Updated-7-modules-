# backend/agents/devops_crew.py
import os
from pydantic import BaseModel, Field
from crewai import Agent, Crew, Process, Task, LLM
from dotenv import load_dotenv

load_dotenv(override=True)

# --- Output Schema ---
class DevOpsOutput(BaseModel):
    language_detected: str = Field(..., description="Primary language detected (e.g., Python, JavaScript)")
    unit_test_file_name: str = Field(..., description="Suggested filename for the test (e.g., test_main.py, app.test.js)")
    unit_test_code: str = Field(..., description="Generated unit tests covering happy paths, edge cases, and error handling")
    ci_cd_file_name: str = Field(..., description="Suggested filename for CI/CD (e.g., .github/workflows/main.yml)")
    ci_cd_code: str = Field(..., description="GitHub Actions YAML with linting, testing, building, and dockerizing stages")
    dockerfile_code: str = Field(..., description="Multi-stage Dockerfile optimized for production")

class DevOpsCrew:
    """DevOps Generator Crew (Module 7)"""



    def __init__(self):
        self.llm = LLM(
            # model="groq/llama-3.3-70b-versatile",
            # model="groq/llama3-70b-8192",
            model="groq/openai/gpt-oss-120b",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.3,
            timeout=120
        )
    def kickoff(self, inputs):
        # 1. Define Agent
        devops_agent = Agent(
            role='Senior QA/DevOps Architect',
            goal='Generate robust unit tests, CI/CD pipelines, and multi-stage Dockerfiles based on a repository\'s source code.',
            backstory=(
                "You are an elite infrastructure engineer and testing advocate. "
                "You specialize in identifying a project's language and automatically generating "
                "bulletproof testing suites (using pytest, jest, etc.), GitHub Actions workflows, "
                "and highly optimized, multi-stage production Dockerfiles."
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # # 2. Define Task
        # generator_task = Task(
        #     description=(
        #         "Analyze the provided GitHub repository source files.\n\n"
        #         "Repository Tree:\n{repo_tree}\n\n"
        #         "Top File Contents:\n{file_contents}\n\n"
        #         "1. Detect the primary programming language.\n"
        #         "2. Generate realistic unit tests for the most critical logic found in the file contents.\n"
        #         "3. Generate a complete GitHub Actions CI/CD pipeline (lint, test, build, dockerize).\n"
        #         "4. Generate a multi-stage Dockerfile suitable for running this application in production.\n"
        #         "Return ONLY the code and filenames requested in the schema. Do not include markdown block ticks (```) inside the string values."
        #     ),
        #     expected_output="A structured JSON object containing the exact code for tests, CI/CD, and Dockerfile.",
        #     agent=devops_agent,
        #     output_pydantic=DevOpsOutput
        # )
        # 2. Define Task
        generator_task = Task(
            description=(
                "Analyze the provided GitHub repository source files.\n\n"
                "Repository Tree:\n{repo_tree}\n\n"
                "Top File Contents:\n{file_contents}\n\n"
                "1. Detect the primary programming language.\n"
                "2. Generate realistic unit tests for the most critical logic found in the file contents.\n"
                "3. Generate a complete GitHub Actions CI/CD pipeline (lint, test, build, dockerize).\n"
                "4. Generate a multi-stage Dockerfile suitable for running this application in production.\n"
            ),
            expected_output=(
                "Return ONLY a valid JSON object with these exact keys: "
                "'language_detected' (string), 'unit_test_file_name' (string), 'unit_test_code' (string), "
                "'ci_cd_file_name' (string), 'ci_cd_code' (string), 'dockerfile_code' (string). "
                "Do NOT wrap the output in markdown block ticks."
            ),
            agent=devops_agent
        )

        # 3. Create Crew
        crew = Crew(
            agents=[devops_agent],
            tasks=[generator_task],
            process=Process.sequential,
            verbose=True
        )

        return crew.kickoff(inputs=inputs)