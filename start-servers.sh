#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to handle cleanup when script is terminated
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${NC}"
  
  if [ ! -z "$EXPRESS_PID" ]; then
    echo -e "${BLUE}Stopping Express server (PID: $EXPRESS_PID)${NC}"
    kill $EXPRESS_PID 2>/dev/null
  fi
  
  if [ ! -z "$PROXY_PID" ]; then
    echo -e "${BLUE}Stopping Proxy server (PID: $PROXY_PID)${NC}"
    kill $PROXY_PID 2>/dev/null
  fi
  
  echo -e "${GREEN}All servers stopped.${NC}"
  exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Print banner
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}       Directory App Server Suite      ${NC}"
echo -e "${GREEN}=======================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed. Please install Node.js to run the servers.${NC}"
  exit 1
fi

# Start Express server
echo -e "${BLUE}Starting Express server on port 3001...${NC}"
node server/server.js > express-server.log 2>&1 &
EXPRESS_PID=$!

# Check if Express server started successfully
sleep 2
if ! ps -p $EXPRESS_PID > /dev/null; then
  echo -e "${RED}Error: Express server failed to start. Check express-server.log for details.${NC}"
  cleanup
fi

echo -e "${GREEN}Express server started with PID: $EXPRESS_PID${NC}"
echo -e "${YELLOW}Logs available at: express-server.log${NC}"

# Start Proxy server
echo -e "${BLUE}Starting Proxy server on port 8080...${NC}"
node improved-proxy.js > proxy-server.log 2>&1 &
PROXY_PID=$!

# Check if Proxy server started successfully
sleep 2
if ! ps -p $PROXY_PID > /dev/null; then
  echo -e "${RED}Error: Proxy server failed to start. Check proxy-server.log for details.${NC}"
  cleanup
fi

echo -e "${GREEN}Proxy server started with PID: $PROXY_PID${NC}"
echo -e "${YELLOW}Logs available at: proxy-server.log${NC}"

# Print success message
echo -e "\n${GREEN}All servers are running!${NC}"
echo -e "${BLUE}Express server:${NC} http://localhost:3001"
echo -e "${BLUE}Proxy server:${NC} http://localhost:8080"
echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for user to press Ctrl+C
wait
