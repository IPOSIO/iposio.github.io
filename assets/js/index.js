"use strict";

/*
 * 
 * author : linwu (http://linwu.name)
 * datetime : 2015-6-4
 */

/**
 * rem 支持
 */
(function () {
  var docElem = document.documentElement;
  var styleElem = document.createElement("style");
  var width = 750;
  var fontSize = 100;
  var widthProportion = function widthProportion() {
    var p = (document.body && document.body.clientWidth || document.getElementsByTagName("html")[0].offsetWidth) / width;
    return p > 1 ? 1 : p < 0.426 ? 0.426 : p;
  };
  var changePage = function changePage() {
    // 只针对屏幕小于750的情况使用rem
    if (document.body.clientWidth <= 750) {
      styleElem.innerHTML = "html{font-size:" + widthProportion() * fontSize + "px!important;}";
    } else {
      styleElem.innerHTML = "";
    }
  };
  window.addEventListener('resize', function () {
    changePage();
  }, false);
  docElem.firstElementChild.appendChild(styleElem);
  changePage();
})();

/**
 * 滚动监听
 * @param target 目标元素选择器
 * @param threshold 阈值
 */
function scrollMonitor(target, threshold) {
  var $win = $(window);
  var timer,
      flag = false;
  var _scrollTop = 0;
  threshold = threshold || 0;

  // 针对锚链接，取出对应模块，计算距离顶部的位置
  var elemInfo = $.map(target, function (elem, index) {
    var $this = $(elem);
    var $target = $($this.find("a").attr("href"));

    $this.on("click", function (e) {
      e.preventDefault();
      var scrollTop = $target.position().top;
      if (index != 0) {
        scrollTop = scrollTop + threshold;
      }
      $(document.body).add(document.documentElement).animate({ "scrollTop": scrollTop }, 300);
      $this.addClass("active").siblings().removeClass("active");

      flag = true;
      timer = setTimeout(function () {
        flag = false;
      }, 300);
    });

    return {
      me: $this,
      target: $target,
      scrollTop: $target.offset().top
    };
  });

  $(window).on("scroll", function () {
    if (flag) {
      return;
    }
    _scrollTop = $win.scrollTop();
    for (var i = elemInfo.length - 1; i >= 0; i--) {
      if (_scrollTop + threshold >= elemInfo[i].scrollTop) {
        elemInfo[i].me.addClass("active").siblings().removeClass("active");
        break;
      }
    }
  }).trigger("scroll");
};

/**
 * 初始化导航点击滑动交互
 */
function initNav() {
  var _scrollTop;
  var $win = $(window);
  var $nav = $(".js-header");
  var $arrow = $(".arrow-down");
  $(window).on("scroll", debounce(function () {
    _scrollTop = $win.scrollTop();
    if (_scrollTop >= 880) {
      $nav.hasClass("active") || $nav.addClass("active");
      $arrow.hasClass("hide") || $arrow.addClass("hide");
    } else {
      $nav.hasClass("active") && $nav.removeClass("active");
      $arrow.hasClass("hide") && $arrow.removeClass("hide");
    }
  }, 10, true)).trigger("scroll");

  $(".js-btn-nav").on("click", function () {
    $(".m-nav").toggleClass("active");
    $nav.toggleClass("active-menu");
  });
  $(".m-nav").on("click", "> ul > li", function (e) {
    e.stopPropagation();
    $(".m-nav").removeClass("active");
  });
}

/**
 * 初始化滚动动画
 */
function scrollAnimate() {
  var wow = new WOW({
    boxClass: 'wow',
    animateClass: 'animated',
    offset: 0,
    mobile: true,
    live: true
  });
  wow.init();
}

/**
 * 初始化Roadmap
 */
function initRoadmap() {
  var $roadmap = $(".m-roadmap");
  var $prev = $roadmap.find(".paging .prev");
  var $next = $roadmap.find(".paging .next");
  var $list = $roadmap.find(".roadmap-list");
  var $listUL = $list.find("ul");
  var $listContainer = $list.find(".container");
  var $dot = $roadmap.find(".highlight-dot");
  var cardWidth = $listUL.find("li").width();
  var listLength = 99999; // 列表总长度
  var step = cardWidth * 2; // 翻页滚动的长度

  $(window).on("resize", function () {
    cardWidth = $listUL.find("li").width();
    if (document.body.clientWidth <= 750) {
      listLength = $listUL.find("li").length * cardWidth;
    } else {
      listLength = $listUL.find("li").length * (cardWidth - 40);
    }
    // 初始化宽度
    $listUL.css("width", listLength);
  }).trigger("resize");

  // 鼠标移动时的高亮
  $listUL.on("mouseenter", "li", function (e) {
    var $this = $(this);
    var index = $this.index();
    var offset = $this.offset();

    $this.addClass("current").siblings().removeClass("current");
    $listUL.find("li:lt(" + (index + 1) + ")").addClass("active");
    $listUL.find("li:gt(" + index + ")").removeClass("active");
    $dot.animate({
      "opacity": 1,
      "left": offset.left + cardWidth / 2 - $dot.width() / 2 + 1
    }, 200);
  });

  // 分页
  $listUL.parent().on("mouseleave", function () {
    $listUL.find("li").removeClass("active");
    $dot.animate({
      "opacity": 0,
      "left": -100
    }, 200);
  });
  var listLeft = 0;
  if (listLength + cardWidth / 2 >= $listContainer.width()) {
    $next.on("click", function () {
      if ($next.hasClass("disabled")) {
        return;
      }
      listLeft = listLeft + step;
      if (listLeft >= listLength - $listContainer.width()) {
        listLeft = listLength - $listContainer.width();
        $next.addClass("disabled");
      }
      $prev.removeClass("disabled");
      $listUL.css("transform", "translateX(-" + listLeft + "px)");
    });

    $prev.on("click", function () {
      if ($prev.hasClass("disabled")) {
        return;
      }
      listLeft = listLeft - step;
      if (listLeft <= 0) {
        listLeft = 0;
        $prev.addClass("disabled");
      }
      $next.removeClass("disabled");
      $listUL.css("transform", "translateX(-" + listLeft + "px)");
    });
  } else {
    $next.addClass("disabled");
  }

  $listUL.find("li:eq(0)").trigger("mouseenter");
}

function initWechatQrCode() {
  var $dialog = $(".qrcode-dialog");
  $(".share-item-wechat").on("click", function () {
    $dialog.show();
  });
  $dialog.find(".close").on("click", function () {
    $dialog.hide();
  });
  $(".wechat-card").on("click", function () {
    var $this = $(this);
    $this.toggleClass("active");
  });
}

$(function () {
  initNav();
  scrollMonitor($(".m-nav > ul > li:not(.language)"), 60);
  scrollAnimate();
  initRoadmap();
  initWechatQrCode();
});