# My Places Explorer

This project allows one to import their save places from Google Maps, and explore what's near by, filtering by category.
For simplicity, this project has an API, Web, and shared types set up as workspaces, not separate repositories.

## Initial setup

Run these commands in the root folder:

To install dependencies:
`npm install`

To provision the DB:
`npm run db:up`

## Running locally

Provided the DB is already running:

To run web and api:
`npm run dev`

## Checks:

To run the local checks:
`npm run check`

Is web reachable at http://localhost:5173/
Is API responding at http://localhost:3000/health
Is API responding with DB live at: http://localhost:3000/db-health
