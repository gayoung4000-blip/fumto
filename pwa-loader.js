// PWA 및 이미지/페이지 초고속 로딩 스크립트 (pwa-loader.js)
(function () {
  // 1. 서비스 워커 등록
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // 루트 기준으로 서비스 워커 등록
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('PUMTO Service Worker 등록 성공:', reg.scope);
        })
        .catch(err => {
          console.error('PUMTO Service Worker 등록 실패:', err);
        });
    });
  }

  // 2. 동적 프리페치(Prefetch) 엔진 구현
  // 사용자가 마우스를 올리거나 터치하기 시작하면 해당 페이지의 리소스를 미리 캐싱
  const prefetchedUrls = new Set();

  function prefetch(url) {
    if (!url || prefetchedUrls.has(url)) return;

    // 외부는 프리페치 안함
    if (url.startsWith('http') && !url.includes(window.location.hostname)) return;

    prefetchedUrls.add(url);

    // a) HTML 프리페치 링크 생성
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    // b) 만약 다음 인트로 단계라면, 그 다음 단계의 이미지 리소스도 선제 캐싱 요청
    const filename = url.split('/').pop().split('?')[0];
    const imagePreloads = {
      'intro-blue.html': ['/PUMTO.img/img.100.png', '/PUMTO.img/img.87.png', '/PUMTO.img/img.20.png'],
      'intro-orange.html': ['/PUMTO.img/img.89.png', '/PUMTO.img/img.90.png'],
      'intro-green.html': ['/PUMTO.img/img.88.png'],
      'login.html': ['/PUMTO.img/img.20.png', '/PUMTO.img/img.87.png', '/PUMTO.img/kakao.png', '/PUMTO.img/naver.png'],
      'home.html': ['/PUMTO.img/img.1.png', '/PUMTO.img/img.2.png', '/PUMTO.img/img.3.png', '/PUMTO.img/img.15.png', '/PUMTO.img/img.18.png']
    };

    if (imagePreloads[filename]) {
      imagePreloads[filename].forEach(imgUrl => {
        const imgLink = document.createElement('link');
        imgLink.rel = 'prefetch';
        imgLink.as = 'image';
        imgLink.href = imgUrl;
        document.head.appendChild(imgLink);
      });
    }
  }

  // 이벤트 위임을 이용해 모든 링크/이동 가능 버튼 감지
  function handleIntersectionOrHover(e) {
    const target = e.target.closest('a, button, [onclick]');
    if (!target) return;

    let targetUrl = '';

    // a 태그 href 추출
    if (target.tagName === 'A') {
      targetUrl = target.getAttribute('href');
    }
    // onclick 이벤트 문자열에서 html 파일명 추출
    else {
      const onclickAttr = target.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes('.html')) {
        const match = onclickAttr.match(/['"]([^'"]+\.html)['"]/);
        if (match) {
          targetUrl = match[1];
        }
      }
    }

    if (targetUrl && targetUrl !== '#' && !targetUrl.startsWith('javascript:')) {
      prefetch(targetUrl);
    }
  }

  // 3. 마우스 호버 및 모바일 터치 이벤트에 반응
  document.addEventListener('mouseover', handleIntersectionOrHover, { passive: true });
  document.addEventListener('touchstart', handleIntersectionOrHover, { passive: true });

  // 4. 온보딩 흐름(intro -> intro-blue -> intro-orange -> intro-green -> login) 순차적 자동 프리패치
  // 사용자가 화면에 진입하면 즉시 다음 단계 파일과 이미지들을 프리패치하여 딜레이 제거
  const currentFile = window.location.pathname.split('/').pop();

  const autoNextSteps = {
    'index.html': '/intro-blue.html',
    'intro.html': '/intro-blue.html',
    'intro-blue.html': '/intro-orange.html',
    'intro-orange.html': '/intro-green.html',
    'intro-green.html': '/login.html',
    'login.html': '/home.html'
  };

  if (autoNextSteps[currentFile]) {
    // 0.5초 대기 후 백그라운드 프리패치 시작 (페이지 초기 렌더링 부하 방지)
    setTimeout(() => {
      prefetch(autoNextSteps[currentFile]);
    }, 500);
  }

  // 5. 면접관 가이드용 빨간색 클릭 동그라미 표시 (Pulsing Guide Dot)
  const SHOW_GUIDE_DOTS = true; // 가이드 점 활성화 여부 (true: 표시, false: 해제)

  function initSideIntro() {
    if (document.querySelector('.side-intro-copy')) return;

    const style = document.createElement('style');
    style.innerHTML = `
      .side-intro-copy {
        position: fixed;
        top: 50%;
        right: calc(50% + 255px);
        width: min(320px, calc(50vw - 285px));
        transform: translateY(-50%);
        z-index: 1;
        pointer-events: none;
        color: #2f2924;
        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
      }
      .side-intro-copy__title {
        margin: 0 0 22px;
        font-size: 48px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0;
        color: #ff9f46;
      }
      .side-intro-copy__headline {
        margin: 0 0 18px;
        font-size: 28px;
        line-height: 1.35;
        font-weight: 800;
        letter-spacing: 0;
        word-break: keep-all;
      }
      .side-intro-copy__description {
        margin: 0;
        font-size: 15px;
        line-height: 1.75;
        font-weight: 500;
        color: rgba(47, 41, 36, 0.72);
        word-break: keep-all;
      }
      @media (max-width: 1180px) {
        .side-intro-copy {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);

    const sideIntro = document.createElement('aside');
    sideIntro.className = 'side-intro-copy';
    sideIntro.setAttribute('aria-label', 'PUMTO 소개');
    sideIntro.innerHTML = `
      <h1 class="side-intro-copy__title">PUMTO</h1>
      <p class="side-intro-copy__headline">검색에서 비교, 예약까지.<br>미술학원 선택의 과정을 더 간단하게</p>
      <p class="side-intro-copy__description">미술학원 탐색 · 비교 · 예약을 하나로 연결한 아동 미술학원 탐색 서비스 PUMTO입니다.</p>
    `;
    document.body.appendChild(sideIntro);
  }

  function initGuideDots() {
    if (!SHOW_GUIDE_DOTS) return;
    // a) 가이드 동그라미 스타일 동적 주입
    const style = document.createElement('style');
    style.innerHTML = `
      .guide-dot {
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: #ff3b30;
        border-radius: 50%;
        z-index: 2147483647;
        pointer-events: none;
        box-shadow: 0 0 0 2px #fff, 0 0 6px rgba(255, 59, 48, 0.8);
        display: inline-block;
      }
      .guide-dot::after {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #ff3b30;
        opacity: 0;
        animation: guide-pulsate 1.5s ease-out infinite;
        box-sizing: border-box;
      }
      @keyframes guide-pulsate {
        0% {
          transform: scale(0.2);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: scale(1.3);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // b) 가이드 점을 생성하여 대상 엘리먼트 위에 배치하는 함수
    function addGuideDot(element, type = 'default') {
      if (!element || element.dataset.hasGuideDot) return;
      element.dataset.hasGuideDot = "true";

      const dot = document.createElement('span');
      dot.className = 'guide-dot';
      document.body.appendChild(dot);

      function updatePosition() {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(element).display === 'none') {
          dot.style.display = 'none';
          return;
        }
        dot.style.display = 'inline-block';

        let offsetX = -6; // right alignment offset
        let offsetY = -6; // top alignment offset

        // 타입별 정밀한 가이드 점 오프셋 계산
        if (type === 'nav-item') {
          // 탭바 아이템: 중앙 상단 부분에 배치
          offsetX = -rect.width / 2 + 5;
          offsetY = 4;
        } else if (type === 'circle' || rect.width < 50) {
          // 뒤로가기 등 둥근/작은 버튼: 우측 상단 모서리 살짝 걸치게
          offsetX = -4;
          offsetY = -2;
        } else if (type === 'card' || rect.width > 200) {
          // 넓은 카드나 배너: 우측 상단 모서리 내부
          offsetX = -12;
          offsetY = 12;
        }

        const bodyRect = document.body.getBoundingClientRect();
        // body 내에서의 상대 좌표 계산 (body가 중앙 정렬된 모바일 컨테이너일 때 오차 방지)
        dot.style.top = (rect.top - bodyRect.top + offsetY) + 'px';
        dot.style.left = (rect.right - bodyRect.left + offsetX) + 'px';
      }

      updatePosition();

      // 스크롤, 리사이즈, 레이아웃 변경 대응 (true를 넣어 내부 스크롤도 감지)
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      // 애니메이션 중에도 즉각적으로 따라가도록 프레임 단위 추적
      let rAF;
      function loop() {
        updatePosition();
        rAF = requestAnimationFrame(loop);
      }
      rAF = requestAnimationFrame(loop);

      // 요소가 DOM에서 제거되면 가이드 점도 동시 제거
      const observer = new MutationObserver(() => {
        if (!document.body.contains(element)) {
          dot.remove();
          cancelAnimationFrame(rAF);
          window.removeEventListener('resize', updatePosition);
          window.removeEventListener('scroll', updatePosition, true);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // c) 페이지별 가이드 대상 엘리먼트 스캔 및 가이드 점 부여
    function scanAndApplyGuideDots() {
      const path = window.location.pathname.split('/').pop() || 'index.html';

      // 1. 공통 및 하단 탭바 가이드 (모든 탭들 표시)
      document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        addGuideDot(item, 'nav-item');
      });

      // 뒤로가기 버튼 공통 가이드
      document.querySelectorAll('.back-btn, .circle-btn[onclick*="back"], button[onclick*="back"]').forEach(item => {
        addGuideDot(item, 'circle');
      });

      // 2. 페이지별 분기 매핑
      if (path === 'intro-blue.html' || path === 'intro-green.html') {
        document.querySelectorAll('.btn-next').forEach(btn => addGuideDot(btn));
      }
      else if (path === 'intro-orange.html') {
        document.querySelectorAll('.btn-allow, .btn-later').forEach(btn => addGuideDot(btn));
      }
      else if (path === 'login.html') {
        document.querySelectorAll('.btn-login').forEach(btn => addGuideDot(btn));
      }
      else if (path === 'home.html') {
        // 내 주변 학원
        const category3 = document.querySelector('.category-grid .category-item:nth-child(3)');
        if (category3) addGuideDot(category3, 'card');

        // 찜한 학원
        const category4 = document.querySelector('.category-grid .category-item:nth-child(4)');
        if (category4) addGuideDot(category4, 'card');

        // 필터 버튼
        const filterBtn = document.querySelector('.filter-btn');
        if (filterBtn) addGuideDot(filterBtn);

        // 특가 상품 카드
        const offerCard = document.querySelector('.offer-card');
        if (offerCard) addGuideDot(offerCard, 'card');

        // 새로 입점한 학원 카드
        const newAcademy = document.querySelector('.new-academy-section, .new-academy-card');
        if (newAcademy) addGuideDot(newAcademy, 'card');

        // 지도 목록보기 버튼
        const listViewBtn = document.querySelector('.list-view-btn');
        if (listViewBtn) addGuideDot(listViewBtn);
      }
      else if (path === 'academy-index.html') {
        // 학원 목록의 카드들 중 첫번째 카드 추천
        const firstCard = document.querySelector('.academy-card, .academy-item');
        if (firstCard) addGuideDot(firstCard, 'card');

        // 지도 둥근 버튼
        const mapBtn = document.querySelector('.floating-map-btn, .map-btn');
        if (mapBtn) addGuideDot(mapBtn, 'circle');
      }
      else if (path === 'art-academy.html') {
        // 찜 버튼
        const wishBtn = document.querySelector('.wish-btn-detail, .wish-circle-btn');
        if (wishBtn) addGuideDot(wishBtn, 'circle');

        // 체험 예약하기 버튼들
        document.querySelectorAll('a[href*="reservation"], .primary-btn.green-btn, .bottom-action-bar a').forEach(btn => {
          addGuideDot(btn);
        });
      }
      else if (path === 'class-reservation.html') {
        // 첫번째 나이 옵션 및 첫번째 시간대 선택, 그리고 등록 버튼
        const firstOption = document.querySelector('.option-btn, .time-slot');
        if (firstOption) addGuideDot(firstOption);

        const submitBtn = document.querySelector('.submit-btn, .next-btn');
        if (submitBtn) addGuideDot(submitBtn);
      }
      else if (path === 'reservation-fin.html') {
        const confirmBtn = document.querySelector('.confirm-btn');
        if (confirmBtn) addGuideDot(confirmBtn);
      }
      else if (path === 'creative-process.html') {
        document.querySelectorAll('.btn-row button, .next-btn, .submit-btn').forEach(btn => {
          addGuideDot(btn);
        });
      }
      else if (path === 'filter.html') {
        const applyBtn = document.querySelector('.btn-apply');
        if (applyBtn) addGuideDot(applyBtn);
      }
      else if (path === 'save.html') {
        // 첫번째 학원 카드
        const mainBtn = document.querySelector('.academy-card');
        if (mainBtn) addGuideDot(mainBtn, 'card');
      }
      else if (path === 'growth.html') {
        // 작품 3 이미지 링크
        const detailLink = document.querySelector('a[href="project-details.html"]');
        if (detailLink) addGuideDot(detailLink, 'card');
      }
    }

    // DOM 구축 완료 즉시 적용 및 리렌더링 고려하여 약간의 딜레이 후 재수행
    scanAndApplyGuideDots();
    setTimeout(scanAndApplyGuideDots, 500);
    setTimeout(scanAndApplyGuideDots, 1500);
  }

  // DOM 로딩 상태 확인하여 안전하게 초기화
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      initSideIntro();
      initGuideDots();
    });
  } else {
    initSideIntro();
    initGuideDots();
  }
})();
