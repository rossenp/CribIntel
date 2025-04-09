# CribIntel

CribIntel is a web application that provides helpful parenting tips for children aged 0-3 years. The app delivers one random, helpful parenting tip per visit with a simple, clean interface designed for parents on the go.

## Features

- Random parenting tips for children aged 0-3
- Simple, clean layout with a playful and warm aesthetic
- Mobile-first, responsive design
- One-click refresh to get a new tip
- Categorized tips with color-coded cards

## Tech Stack

- **Frontend**: React.js with Tailwind CSS for styling
- **Backend**: Express.js with a JSON file-based store
- **API Endpoint**: GET /api/tip returns a random parenting tip

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install server dependencies
cd CribIntel/server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the Application

1. Start the server:

```bash
# From the server directory
npm start
```

2. Start the client (in a separate terminal):

```bash
# From the client directory
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Development

- The server runs on port 5000
- The client runs on port 3000 and proxies API requests to the server

## Project Structure

```
CribIntel/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # React components
│       └── ...
└── server/                 # Express backend
    ├── tips.json           # Database of parenting tips
    └── server.js           # Express server
```

## License

This project is licensed under the MIT License.
