import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 배포 시 저장소명 기반 베이스 경로 설정
const repoName = 'coex-recommender'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})
