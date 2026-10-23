<script setup lang="ts">
import { useUserStore } from '../stores/useUserStore'
const userStore = useUserStore()
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand" aria-label="HowToYoga, inicio">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-opacity=".24" />
            <path d="M8 24.5C12.5 24.5 15.2 21.9 16.8 17.5C18.6 22 21.3 24.5 26 24.5C28.6 24.5 30.7 23.2 32 21.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            <path d="M12.5 29.5H27.5M20 9.5V13.5M12.7 13.1L15.2 15.6M27.3 13.1L24.8 15.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-copy">
          <span class="brand-name">HowToYoga<span class="brand-period">.</span></span>
          <span class="brand-subtitle">Formación para enseñar con criterio</span>
        </span>
      </RouterLink>

      <nav class="header-nav" aria-label="Navegación principal">
        <RouterLink to="/" class="nav-link">Mi recorrido</RouterLink>
        <RouterLink to="/#curriculum" class="nav-link">Temario</RouterLink>
      </nav>

      <div class="header-progress" aria-label="Tu progreso">
        <span class="streak-pill" title="Días consecutivos de estudio"><span aria-hidden="true">✳</span> {{ userStore.progress.streak }} días</span>
        <span class="xp-pill" title="Experiencia acumulada"><span aria-hidden="true">↗</span> {{ userStore.progress.xp }} XP</span>
      </div>
    </div>
  </header>
</template>
