import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs/promises';
import svgr from '@svgr/rollup';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            src: resolve(__dirname, 'src'),
        },
    },
    esbuild: {
        loader: 'tsx',
        include: /src\/.*\.tsx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                {
                    name: 'load-js-files-as-tsx',
                    setup(build) {
                        build.onLoad(
                            { filter: /src\/.*\.js$/ },
                            async (args) => ({
                                loader: 'tsx',
                                contents: await fs.readFile(args.path, 'utf8'),
                            })
                        );
                    },
                },
            ],
        },
    },



    // plugins: [react(),svgr({
    //   exportAsDefault: true
    // })],

    plugins: [svgr(), react()],

    // Build optimization - Code splitting for smaller chunks
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React core
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                        return 'vendor-react';
                    }
                    // React Router
                    if (id.includes('node_modules/react-router')) {
                        return 'vendor-router';
                    }
                    // Flowbite UI
                    if (id.includes('node_modules/flowbite')) {
                        return 'vendor-flowbite';
                    }
                    // Charts
                    if (id.includes('node_modules/apexcharts')) {
                        return 'vendor-charts';
                    }
                    // Icons
                    if (id.includes('node_modules/@iconify')) {
                        return 'vendor-icons';
                    }
                    // Utilities
                    if (id.includes('node_modules/dayjs') || id.includes('node_modules/axios')) {
                        return 'vendor-utils';
                    }
                },
            },
        },
        chunkSizeWarningLimit: 500,
    },

    // Proxy API requests to backend server
    server: {
        host: '0.0.0.0', // Expose to network
        port: 5173,
        strictPort: false, // Try next port if 5173 is busy
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: process.env.VITE_API_URL || 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
});