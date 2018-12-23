Vue.directive('focus-start', {
  componentUpdated(el) {
    el.focus();
  }
});
Vue.directive('focus', {
  inserted(el) {
    el.focus();
  }
});

v = new Vue({
  el: '#app',
  data: {
    currentView: 'start',
    startGameLabel: 'Пожалуйста, подождите...',
    level: 0,
    score: 0,
    allGoods: null,
    timer: null,
    scoreDiff: 0,
    correctAnswer: 0,
    timeLeft: 0,
    totalTime: 0,
    gameOverMessage: null,
    globalConfig: {
      timePerGood: [],
      photos: [
        'https://vk.cc/8OhVlH',
        'https://vk.cc/8OhVGM',
        'https://vk.cc/8OhVL3',
        'https://vk.cc/8OhVPf',
        'https://vk.cc/8OhW0g',
        'https://vk.cc/8OhW52',
        'https://vk.cc/8OhWdg',
        'https://vk.cc/8OhWiE',
        'https://vk.cc/8OhWrw',
      ]
    },
    shareButtonHtml: null
  },
  created() {
    let dataURL = '/goods.json';
    let goodsNum = [5];
    this.globalConfig.timePerGood.push(30);
    for (let i = 1; i <= 30; i++) {
      goodsNum.push(Math.round(0.4*i+3));
      this.globalConfig.timePerGood.push(5 - 0.07*(i-1));
    }
    let self = this;
    $.getJSON(dataURL, function(data) {
      // Сформировать списки продуктов на все уровни вперед
      self.allGoods = Array(6);
      for (let i = 0; i < self.allGoods.length; i++) {
        self.allGoods[i] = []
      }
      self.allGoods[1].push(data.regular[0])
      self.allGoods[1].push(data.regular[1])
      for (good of self.shuffle(data.fixed)) {
        let n = self.randomArrayItem(good.level);
        while(self.allGoods[n].length >= goodsNum[n] && n < 30) {
          n += 1;
        }
        self.allGoods[n].push({name: good.name, price: good.price})
      }
      self.allGoods[1] = self.shuffle(self.allGoods[1])
      self.allGoods[0].push({name: 'Добро пожаловать в торговый центр "Оливье"', price: 1})
      self.allGoods[0].push({name: 'Клади товары в корзину', price: 1})
      self.allGoods[0].push({name: 'Считай итоговую стоимость', price: 2})
      self.allGoods[0].push({name: 'Успей хотя бы примерно посчитать итоговую сумму', price: 3})
      self.allGoods[0].push({name: 'Пока в магазине не собралась огромная очередь', price: 4})
      self.allGoods[0].push({name: 'Чем точнее ответ, тем больше очков', price: 6})
      self.startGameLabel = 'Начать игру';
    });
    document.addEventListener('onbeforeunload', function(e){
      e.preventDefault();
      e.returnValue = "Внимание: после перезагрузки страницы игра начнется заново.";
    });
  },
  methods: {
    randomArrayItem: function(arr){
      let n = Math.floor(Math.random()*arr.length)
      return arr[n]
    },
    shuffle: function(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    startGame: function() {
      this.currentView = 'game';
      this.totalTime = this.globalConfig.timePerGood[this.level]*this.allGoods[this.level].length;
      this.timeLeft = this.totalTime;
    },
    goCheckout: function() {
      this.currentView = 'checkout';
    },
    finishLevel: function(e) {
      this.currentView = 'levelscore';
      if (this.timer) {
        clearInterval(this.timer)
      }
      if (e.scoreDiff == 0) {
        this.finishGame('Точная сумма вышла ' + e.correctAnswer + ' руб. Грубовато, лучше попробовать еще раз');
      } else {
        this.scoreDiff = e.scoreDiff;
        if (this.level > 0) {
          this.score += e.scoreDiff;
        }
        this.correctAnswer = e.correctAnswer;
      }
    },
    nextLevel: function(scoreDiff) {
      this.currentView = 'game';
      if (this.level + 1 < this.allGoods.length) {
        this.level += 1;
        this.totalTime = this.globalConfig.timePerGood[this.level]*this.allGoods[this.level].length;
        this.timeLeft = this.totalTime;
        this.setTimer();
      } else {
        this.finishGame('Поздравляем! Вы прошли игру!');
      }
    },
    finishGame: function(message) {
      if (this.timer) {
        clearInterval(this.timer)
      }
      this.gameOverMessage = message;
      let header_part = 'Мне удалось достичь ' + this.level + ' уровня, набрав ' + this.score + ' очков'
      let comment = 'Играю в игру, потому что хочу заранее знать, сколько отдам денег на кассе.'
      if (this.level == this.allGoods.length - 1) {
        header_part = 'Мне удалось пройти все уровни, набрав ' + this.score + ' очков';
        comment = 'Я всегда в курсе сколько денег я потрачу, еще не дойдя до кассы.';
      }
      let img = Math.floor(Math.random()*9) + 1
      this.shareButtonHtml = VK.Share.button(
        {
          title: 'ТЦ "Оливье" - ' + header_part,
          comment: comment,
          image: "https://olivie-mall.github.io/img/"+ img + ".jpg",
          noparse: false
        },
        {
          type: "round",
          text: "Поделиться результатами"
        })
      this.currentView = 'gamefinal';
    },
    setTimer: function() {
      if (this.timer) {
        clearInterval(this.timer)
      }
      this.timer = setInterval(
        () => {
          if (this.timeLeft > 0) {
            this.timeLeft--;
          } else {
            clearInterval(this.timer);
            this.timer = null;
            if (this.level > 0) {
              this.finishGame('В магазине собралась такая очередь, что можно не торопиться');
            }
          }
        },
        1000
      );
    }
  },
  components: {
    start: {
      template: '#start',
      props: ['startGameLabel'],
      methods: {
        startGame: function() {
          this.$emit('start-game')
        }
      }
    },
    game: {
      template: '#game',
      data: function() {
        return {
          currGoodIndex: 0,
        }
      },
      props: ['level', 'timeLeft', 'totalTime', 'allGoods'],
      methods: {
        skipTutorial: function() {
          this.$emit('next-level');
        },
        nextGood: function() {
          this.currGoodIndex += 1;
        },
        goCheckout: function() {
          this.$emit('go-checkout');
          this.currGoodIndex = 0;
        }
      },
      computed: {
        timeLeftPerc: function() {
          return this.timeLeft/this.totalTime*100;
        },
        anyGoodsLeft: function() {
          return this.currGoodIndex < this.allGoods[this.level].length-1;
        }
      }
    },
    checkout: {
      template: '#checkout',
      data: function() {
        return {
          answer: null
        }
      },
      mounted() {
        if (this.level == 0) {
          this.$emit('finish-level', {scoreDiff: 3, correctAnswer: 0});
        }
      },
      props: ['level', 'timeLeft', 'totalTime', 'allGoods'],
      methods: {
        finishLevel: function() {
          if (this.answer != null && this.answer != undefined) {
            totalSum = this.allGoods[this.level].map((x)=> x.price).reduce((a,c)=>a+c);
            error_abs = Math.abs(totalSum - this.answer)/totalSum;
            error_rel = error_abs/totalSum;
            if (error < 0.01) {
              this.$emit('finish-level', {scoreDiff: 3, correctAnswer: totalSum});
            } else if (error < 0.1) {
              this.$emit('finish-level', {scoreDiff: 2, correctAnswer: totalSum});
            } else if (error < 0.33) {
              this.$emit('finish-level', {scoreDiff: 1, correctAnswer: totalSum});
            } else {
              this.$emit('finish-level', {scoreDiff: 0, correctAnswer: totalSum});
            }
            this.answer = null;
          }
        }
      },
      computed: {
        timeLeftPerc: function() {
          return this.timeLeft/this.totalTime*100;
        }
      }
    },
    levelscore: {
      template: '#levelscore',
      data: function() {
        return {
          buttonLabel: this.level == 0? 'Поехали!':'Следующий уровень'
        }
      },
      props: ['level', 'scoreDiff', 'correctAnswer'],
      methods: {
        nextLevel: function() {
          this.$emit('next-level')
        }
      }
    },
    gamefinal: {
      template: '#gamefinal',
      props: ['score', 'level', 'gameOverMessage', 'shareButtonHtml']
    }
  }
})
