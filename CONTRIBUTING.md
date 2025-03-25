# Contributing to BioDaptor

Thank you for your interest in contributing to BioDaptor! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct, which ensures a welcoming and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue in the GitHub repository with the following information:

- Clear description of the bug
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or code snippets if applicable
- Environment information (OS, Node.js version, etc.)

### Suggesting Enhancements

We welcome suggestions for improvements or new features. Please create an issue with:

- Clear description of the enhancement
- Why it would be valuable
- How it should work
- Any implementation ideas you have

### Pull Requests

We follow a standard GitHub workflow for contributions:

1. Fork the repository
2. Create a new branch from `develop` with a descriptive name
   - Feature branches should be named `feature/your-feature-name`
   - Bug fix branches should be named `fix/issue-description`
3. Make your changes
4. Add or update tests as necessary
5. Ensure all tests pass
6. Update documentation if needed
7. Submit a pull request to the `develop` branch

#### Pull Request Guidelines

- Keep changes focused and atomic
- Follow the existing code style
- Include tests for new features or bug fixes
- Update documentation
- Reference related issues in your PR description using the GitHub notation (e.g., "Fixes #123")

## Development Setup

1. Clone the repository
   ```
   git clone https://github.com/BioDaptor/BioDaptor.git
   cd BioDaptor
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run tests
   ```
   npm test
   ```

## Branching Strategy

- `main` - Production-ready code
- `develop` - Main development branch
- Feature branches - Created from `develop`, merged back when complete
- Release branches - Created from `develop` when preparing for releases
- Hotfix branches - Created from `main` for urgent fixes

## Commit Messages

Please use clear, descriptive commit messages that explain the "what" and "why" of your changes. We recommend following the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

## Code Style

We follow standard TypeScript and JavaScript best practices:

- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic
- Follow the existing code structure

## License

By contributing to BioDaptor, you agree that your contributions will be licensed under the project's MIT license.
