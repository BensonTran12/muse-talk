FROM node:20-bullseye


WORKDIR /usr/src/app


COPY package*.json ./
RUN npm install


COPY . .


# Build Vite/React app
RUN npm run build


# Start Electron app
CMD ["npm", "run", "electron"]