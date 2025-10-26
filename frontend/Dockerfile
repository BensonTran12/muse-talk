FROM node:20-bullseye

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# Copy the entire frontend folder including index.html
COPY . .

# Build the app
RUN npm run build

CMD ["npm", "run", "start"]
