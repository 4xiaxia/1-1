<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1t7LnRhZ38kBe2S2AJXPVJiEtqcQglDok

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Core Execution Principle (核心执行原则)

This principle guides how we organize maintenance and iterations for this AI Studio app (用于指导本应用的维护与迭代):

**Holistic-focused-integrated approach (总分总治理思想)** consists of:
1. Begin with a whole-project scan (e.g., dependency mapping and architecture read-through) to clarify structure and pain points （先全局扫描梳理项目结构与问题脉络）.
2. Tackle fixes module by module, addressing prioritized issues in each area （再分模块攻坚修复）.
3. Finish with integrated verification of the end-to-end experience (e.g., smoke tests or guided walkthroughs) （最后整合闭环验证整体运行效果）.
