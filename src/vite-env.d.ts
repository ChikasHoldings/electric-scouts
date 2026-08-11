/// <reference types="vite/client" />

// Gives `import.meta.env.VITE_*` a type. Without this, every module that reads
// Vite env vars fails typecheck with "Property 'env' does not exist on type
// 'ImportMeta'".
