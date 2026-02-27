# Application Architecture Guide

## Goals
- Predictable structure
- Scalability
- Testability
- Minimal coupling

## Folder Structure
- `app/core` – singleton services, global config
- `app/shared` – reusable UI components, pipes, directives
- `app/features` – feature-isolated logic and UI
- `app/data-access` – API and persistence logic

## Principles
- One feature = one responsibility
- UI never talks directly to APIs
- Business logic stays out of components

## Dependency Direction
UI → Feature → Data Access → External APIs
