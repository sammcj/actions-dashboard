#
# Builder / dev stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:20 as builder
WORKDIR /app

ENV NODE_ENV=development

COPY . ./

RUN npm ci && npm run build

#
# Production stage.
# This state compile get back the JavaScript code from builder stage
# It will also install the production package only
#
FROM node:20 as production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --quiet --only=production && npm cache clean --force

## We just need the build to execute the command
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["npm", "run", "start"]
