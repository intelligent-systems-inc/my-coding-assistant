## 📘 useEffect Assistant – AI-powered useEffect Reviews


### 🧠 What is useEffect Assistant?

`useEffect Assistant` is a VS Code extension that helps you write better, more efficient `useEffect` hooks in your React code. It analyzes your code and provides insights to help you avoid the common pitfalls with `useEffect` and improve performance.


### 📌 Our Why

There’s a mountain of best practices, docs, and blog posts — but very little of it is easy to **apply** when you’re deep in code. `useEffect Assistant` brings the knowledge to you, when and where you need it.

Think of it as an AI-powered code reviewer that helps you avoid common pitfalls and follow best practices — right from your editor.

### 🚀 Features

It automatically detects all `useEffect` calls across your codebase and adds clickable decorations around them, which when clicked, opens a side-panel containing implications of the clicked _useEffect_ on UX and performance, and offers suggestions for improvement.

- 🎯 **Detects `useEffect` usages** across your entire codebase
- 💡 **Contextual tips and feedback** for each hook
- 🪄 **Inline decorations** to make suggestions easy to discover
- 🖼️ **Side panel** with actionable recommendations
- 🤖 **Powered by AI**, so it learns and improves over time


**Future plans** include sending more code context along with each useEffect call to provide holistic feedback. [See roadmap]().

### 📸 Screenshots

![Inline decorations for each useEffect](https://github.com/intelligent-systems-inc/my-coding-assistant/images/annotations.png)

![Side panel with suggestions](https://github.com/intelligent-systems-inc/my-coding-assistant/images/suggestions1.png)

![Side panel with suggestions](https://github.com/intelligent-systems-inc/my-coding-assistant/images/suggestions2.png)


### 🛠 Installation

**Note**: You will require an OpenAI API key, but the good news is if you opt in for data sharing, they won't charge you 😁

And, installation is manual right now 😬

1. `git clone` this repository
2. `npm install`
3. `npm run compile`
4. Press F5

This will start the extension development host, where you can open your project and use the extension.

**Tip**: This repo contains some sample code with useEffects in the testing folder


### 🛣 Roadmap

- [x] Basic detection and inline decoration
- [x] Side panel with suggestions
- [ ] Include component-level and file-level context in analysis for integrated suggestions
- [ ] Support other hooks like `useMemo`, `useCallback`
- [ ] Support feedback and suggestions for third-party libraries present in the codebase


### 🤝 Contributing

Got ideas or bug reports? They are most welcome!

1. Clone the repo
2. Run the extension locally
3. Open a PR with your changes

### 📬 Feedback

We’d love to hear how this extension is helping you. Tweet [@kaykathuria](https://x.com/kaykathuria) or open an issue!
