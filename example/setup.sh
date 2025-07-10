#!/bin/bash

echo "🚀 Setting up LangChat Example App..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created! Please edit it with your Supabase credentials."
    echo ""
    echo "📋 You need to:"
    echo "1. Create a Supabase project at https://supabase.com"
    echo "2. Get your project URL and anon key from Project Settings > API"
    echo "3. Edit the .env file with your credentials"
    echo "4. Run the SQL schema from ../src/data/schemas/index.sql in Supabase"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete! Next steps:"
    echo "1. Configure your .env file with Supabase credentials"
    echo "2. Run 'npm start' to start the development server"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
