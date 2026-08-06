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

## How to export your saved places:

1. Go to takeout.google.com.
2. Click "Deselect all", then check just "Saved".
3. Continue through the export options (file type .zip, default size limit is way more than enough for this).
4. Create the export — Google emails you when it's done.
5. Download and unzip it. Inside you'll find a Takeout/Saved/ folder containing csv files for all your saved lists.
6. Drop the desired csv files in the uploads folder.
