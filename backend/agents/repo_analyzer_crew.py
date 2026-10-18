# backend/agents/repo_analyzer_crew.py
import os
from typing import List
from pydantic import BaseModel, Field
from crewai import Agent, Crew, Process, Task, LLM
from dotenv import load_dotenv

load_dotenv(override=True)

# --- Output Schema ---
class CategoryBreakdown(BaseModel):
    readme_quality: int = Field(..., description="Score 0-100 for README quality")
    repository_structure: int = Field(..., description="Score 0-100 for project structure")
    commit_health: int = Field(..., description="Score 0-100 for commit health/version control practices")
    devops_readiness: int = Field(..., description="Score 0-100 for CI/CD and Docker presence")
    code_quality: int = Field(..., description="Score 0-100 for code cleanliness and standards")

class RepoAnalysisResult(BaseModel):
    overall_score: int = Field(..., description="Overall readiness score from 0-100")
    letter_grade: str = Field(..., description="Letter grade (A, B, C, D, F)")
    category_scores: CategoryBreakdown = Field(..., description="Categorical breakdown of scores")
    tech_stack: List[str] = Field(..., description="Detected tech stack")
    improvements: List[str] = Field(..., description="AI-generated improvement suggestions tailored to the optional job description")

class RepoAnalyzerCrew:
    """GitHub Repository Analyzer Crew (Module 6)"""



    def __init__(self):
        self.llm = LLM(
            # model="groq/llama-3.3-70b-versatile",
            # model="groq/llama3-70b-8192",
            model="groq/openai/gpt-oss-120b",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.2,
            timeout=60
        )

    def kickoff(self, inputs):
        # 1. Define Agent
        auditor_agent = Agent(
            role='Senior GitHub Repository Auditor',
            goal='Evaluate a repository\'s readiness for job applications and portfolio display.',
            backstory=(
                "You are an elite code reviewer and technical recruiter. "
                "You evaluate open-source repositories to see if developers demonstrate professional standards. "
                "You are strict but fair, evaluating README Quality, Repository Structure, Commit Health, "
                "Tech Stack Detection, DevOps Readiness, and Code Quality Signals."
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # # 2. Define Task
        # analysis_task = Task(
        #     description=(
        #         "Analyze the provided GitHub repository data.\n\n"
        #         "Target Job Description:\n{job_description}\n\n"
        #         "Repository Tree:\n{repo_tree}\n\n"
        #         "Top File Contents:\n{file_contents}\n\n"
        #         "Provide a deterministic JSON report evaluating the six core areas. "
        #         "If a Job Description is provided, tailor the improvement suggestions to it."
        #     ),
        #     expected_output="A structured JSON report matching the exact schema requirements.",
        #     agent=auditor_agent,
        #     output_pydantic=RepoAnalysisResult
        # )
        # 2. Define Task
        analysis_task = Task(
            description=(
                "Analyze the provided GitHub repository data.\n\n"
                "Target Job Description:\n{job_description}\n\n"
                "Repository Tree:\n{repo_tree}\n\n"
                "Top File Contents:\n{file_contents}\n\n"
                "Provide a deterministic JSON report evaluating the six core areas. "
                "If a Job Description is provided, tailor the improvement suggestions to it."
            ),
            expected_output=(
                "Return ONLY a valid JSON object with these exact keys: "
                "'overall_score' (int), 'letter_grade' (string), "
                "'category_scores' (object with 'readme_quality', 'repository_structure', 'commit_health', 'devops_readiness', 'code_quality' as ints), "
                "'tech_stack' (list of strings), 'improvements' (list of strings). "
                "Do NOT wrap the output in markdown block ticks."
            ),
            agent=auditor_agent
        )

        # 3. Create Crew
        crew = Crew(
            agents=[auditor_agent],
            tasks=[analysis_task],
            process=Process.sequential,
            verbose=True
        )

        return crew.kickoff(inputs=inputs)