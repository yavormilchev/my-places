# My Places Explorer

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

To run just the api:
`npm run dev:api`

## Checks:

Is web reachable at http://localhost:5173/
Is API responding at http://localhost:3000/health
Is API responding with DB live at: http://localhost:3000/db-health
