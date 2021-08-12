(function() {

  var _Function_prototype_bind = Function.prototype.bind;
  var _Array = Array;
  var _Date = Date;
  var _setTimeout = setTimeout;
  var _setInterval = setInterval;
  var _clearInterval = clearInterval;
  var _console = console;
  var _localStorage = window.localStorage;
  var _document = document;

  function resolveRecursively(value, fnResolved) {
    if (value != null) try {
      if (typeof value.then === "function") {
        var pending = true;
        var performResolve = function (value) {
          if (pending) {
            pending = false;
            resolveRecursively(value, fnResolved);
          }
        };
        var performReject = function (error) {
          if (pending) {
            pending = false;
            fnResolved(false, error);
          }
        };
        try {
          value.then(performResolve, performReject);
        } catch (error) {
          performReject(error);
        }
        return;
      }
    } catch (error) {
      return fnResolved(false, error);
    }
    fnResolved(true, value);
  }

  function createPending(fnExecutor) {
    var state = /*PENDING*/0;
    var value = null;
    var callbacks = [];

    var executeCallbacks = function () {
      var callbackList = callbacks;
      callbacks = null;
      for (var i = 0; i < callbackList.length; i++) {
        (0, callbackList[i])();
      }
    };

    var performResolve = function (resolvable) {
      if (!state) {
        state = /*RESOLVING*/1;
        resolveRecursively(resolvable, function (success, resolved) {
          state = success ? /*RESOLVED*/2 : /*REJECTED*/3;
          value = resolved;
          executeCallbacks();
        });
      }
    };
    var performReject = function (error) {
      if (!state) {
        state = /*REJECTED*/3;
        value = error;
        executeCallbacks();
      }
    };

    try {
      fnExecutor(performResolve, performReject);
    } catch (error) {
      performReject(error);
    }

    return {
      then: function (fnFulfilled, fnRejected) {
        return createPending(function (resolve, reject) {
          var callback = function () {
            try {
              (state < /*REJECTED*/3
                ? typeof fnFulfilled === "function"
                  ? resolve(fnFulfilled(value))
                  : resolve(value)
                : typeof fnRejected === "function"
                  ? resolve(fnRejected(value))
                  : reject(value));
            } catch (error) {
              reject(error);
            }
          };

          if (state < /*FULFILLED*/2) {
            callbacks.push(callback);
          } else {
            callback();
          }
        });
      }
    };
  }

  var time = (function () {
    var speedMultiplier = 1;

    if (_localStorage) {
      var storageItem = "foxdev-last-visit";

      var tsNow = (new _Date()).getTime();
      var tsLastVisit = _localStorage.getItem(storageItem);
      var msDiff = tsNow - tsLastVisit;

      if (msDiff < 180000) {
        speedMultiplier = 3;
      } else if (tsNow - tsLastVisit < 600000) {
        speedMultiplier = 2;
      }

      _localStorage.setItem(storageItem, "" + tsNow);
    }

    return function (ms) {
      return ms / speedMultiplier;
    };
  })();

  var cursor = (function () {
    var element = _document.getElementById("cursor");

    function toggle(shown) {
      element.style.display = shown ? "initial" : "none";
    }

    var blinkTimeout = 500;
    var blinkHandle = null;

    function blinkStart(value) {
      blinkClear();

      var shown = true;
      blinkHandle = _setInterval(function () {
        toggle(shown = !shown);
      }, blinkTimeout);

      return value;
    }

    function blinkClear(value) {
      if (blinkHandle) {
        _clearInterval(blinkHandle);
        blinkHandle = null;
      }

      toggle(true);

      return value;
    }

    function hide(value) {
      blinkClear();
      toggle(false);
      return value;
    }

    blinkStart();

    return {
      blink: blinkStart,
      stop: blinkClear,
      hide: hide
    };
  })();

  function bind(arg0) {
    var argFn = arg0;
    arg0 = this;
    return _Function_prototype_bind.apply(argFn, arguments);
  }

  function wait(timeout, value) {
    return createPending(function (resolve) {
      _setTimeout(resolve, timeout, value);
    });
  }

  var targetElement = _document.getElementById("target");
  function targetAppendTextNode() {
    return targetElement.appendChild(_document.createTextNode(""));
  }

  function writeOverwrite(text, target) {
    target.nodeValue = text;
    return target;
  }

  function writeSlowly(timeout, text, target) {
    return createPending(function (resolve, reject) {
      cursor.stop();
      var index = 0;
      var handle = _setInterval(function () {
        try {
          if (index < text.length) {
            target.nodeValue += text.charAt(index++);
            return;
          }
          resolve(target);
        } catch (error) {
          reject(error);
        }
        cursor.blink();
        _clearInterval(handle);
      }, timeout);
    });
  }

  function outputLink(prefix, text, href) {
    return wait(time(100))
      .then(targetAppendTextNode)
      .then(bind(writeSlowly, time(10), "\n"))
      .then(bind(writeSlowly, time(30), prefix))
      .then(function () {
        var targetLink = targetElement.appendChild(_document.createElement("a"));
        return wait(time(100), targetLink.appendChild(_document.createTextNode("")))
          .then(bind(writeSlowly, time(40), text))
          .then(bind(wait, time(10)))
          .then(function () {
            targetLink.href = href;
          });
      });
  }

  function outputQuotes() {
    var quoteList = [
      "love u always"
    //"licking under armpits"
    , "least-privileged user account"
    //"link-up america"
    , "the portuguese word for the moon"
    , "the portuguese word for the moon derived from the latin word l\u016Bna"
    , "the portuguese word for a full moon"
    , "the word used to call somebody moody in portuguese"
    , "the lightweight embeddable programming language"
    , "the programming language that powers roblox"
    , "the programming language that powers garry's mod"
    //"the ancient hawaiian martial art"
    , "Lua Saturni, the not-so-well-known roman goddess"
    ];
    var quoteCount = quoteList.length;

    var pending = wait(time(100)).then(targetAppendTextNode);

    var selectedCount = 5;
    var selectedList = new _Array(selectedCount);

    for (var i = selectedCount; i--; ) for (var n = quoteCount; n--; ) {
      var selectedQuote = quoteList[Math.random() * quoteCount | 0];
      if (selectedList.indexOf(selectedQuote) < 0) {
        selectedList.push(selectedQuote);
        pending = pending
          .then(bind(wait, time(300)))
          .then(bind(writeOverwrite, selectedQuote));
        break;
      }
    }

    return pending;
  }

  function nextLine(target) {
    return wait(time(100), target)
      .then(bind(writeSlowly, time(10), "\n\n"))
      .then(bind(wait, time(100)))
      .then(targetAppendTextNode);
  }

  wait(time(2000))
    .then(targetAppendTextNode)
    .then(bind(writeSlowly, time(50), "Hello netcitizen"))
    .then(bind(writeSlowly, time(80), ", "))
    .then(bind(writeSlowly, time(50), "welcome to my website"))
    .then(bind(wait, time(100)))
    .then(bind(writeSlowly, time(80), "!!!"))
    .then(nextLine)
    .then(bind(writeSlowly, time(40), "My name is Lua, as in \""))
    .then(outputQuotes)
    .then(targetAppendTextNode)
    .then(bind(writeSlowly, time(100), "\""))
    .then(nextLine)
    .then(bind(writeSlowly, time(40), "I'm an avid computer programmer and systems administrator"))
    .then(bind(writeSlowly, time(80), ", "))
    .then(bind(writeSlowly, time(40), "and a professional foxgirl"))
    .then(bind(writeSlowly, time(80), " "))
    .then(bind(writeSlowly, time(120), ":3"))
    .then(nextLine)
    .then(bind(writeSlowly, time(40), "You should come find me around the web"))
    .then(bind(writeSlowly, time(80), "!!"))
    .then(bind(outputLink, "  Email    →  ", "lua@foxgirl.dev", "mailto:lua@foxgirl.dev"))
    .then(bind(outputLink, "  Twitter  →  ", "luavixen", "https://twitter.com/luavixen"))
    .then(bind(outputLink, "  GitHub   →  ", "luawtf", "https://github.com/luawtf"))
    .then(targetAppendTextNode)
    .then(nextLine)
    .then(bind(writeSlowly, time(50), "Thank you for checking out my page"))
    .then(bind(wait, time(100)))
    .then(bind(writeSlowly, time(80), " "))
    .then(bind(writeSlowly, time(120), "<3"))
    .then(bind(wait, time(300)))
    .then(bind(writeSlowly, time(80), "\n\n\n\n"))
    .then(bind(wait, 5000))
    .then(cursor.hide)
    .then(function () { _console.log("printing completed"); }, _console.error);

  _console.log("hey !!! i see u snooping around back here :3");
  _console.log("come check out the ./script.js file!! i put a lot of effort into it");
  _console.log("one of my main goals was internet explorer compatibility");
  _console.log("so the way im doing things is a little outdated");
  _console.log("also!! marvel at the beauty of my micro promise implementation");

})();
