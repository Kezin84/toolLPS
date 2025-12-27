<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="app">
    <!-- ================= MAIN ================= -->
    <main class="main">
      <RouterView />
    </main>

    <!-- ================= BOTTOM BAR (ALL DEVICES) ================= -->
    <nav class="bottom-bar" aria-label="Bottom navigation">
      <RouterLink
        to="/bao-gia"
        class="nav-btn"
        :class="{ active: route.path.startsWith('/bao-gia') }"
      >
        <span class="icon">📄</span>
        <span class="text">Báo giá</span>
      </RouterLink>

      <RouterLink
        to="/shop"
        class="nav-btn"
        :class="{ active: route.path.startsWith('/shop') }"
      >
        <span class="icon">🛒</span>
        <span class="text">Mua hàng</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* ================= ROOT ================= */
.app {
  width: 100%;
  min-height: 100vh;
  background: #f4f6f8;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* ================= MAIN ================= */
.main {
  flex: 1;
  width: 100%;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  overflow-x: hidden;

  /* chừa khoảng cho bottom bar để page không bị che */
  padding-bottom: 70px;
}

/* ================= BOTTOM BAR (ALL DEVICES) ================= */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;

  height: 58px;
  background: #020617;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  display: flex;
  align-items: center;
  justify-content: space-around;

  z-index: 9990;
}

.nav-btn {
  flex: 1;
  height: 100%;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;

  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;

  font-size: 12px;
  user-select: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.nav-btn .icon {
  font-size: 16px;
  line-height: 1;
}

.nav-btn.active {
  color: #fff;
}

.nav-btn.active .icon {
  transform: translateY(-1px);
}
</style>
