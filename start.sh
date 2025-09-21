#!/bin/bash

# Change to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the application
gunicorn -w 4 -b 0.0.0.0:$PORT app:app
