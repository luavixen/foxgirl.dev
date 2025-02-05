(function() {

  var _Math = Math;
  var _Date = Date;
  var _Array_prototype_slice = Array.prototype.slice;
  var _setTimeout = setTimeout;
  var _setInterval = setInterval;
  var _clearInterval = clearInterval;
  var _localStorage = window.localStorage;
  var _navigator = window.navigator;
  var _document = window.document;
  var _console = window.console;

  if (_console == null) {
    var logInfo = function () {};
    var logError = function () {
      alert(_Array_prototype_slice.call(arguments).join(' '));
    };
    _console = { log: logInfo, error: logError };
  }

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
      var callbackList = callbacks; callbacks = null;
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

  var isRobot = (/googlebot|adsbot|mediapartners|bing|msnbot|duckduckbot|yahoo|ecosia|kagi|baidu|yandex|teoma|slurp|spider|crawl|archive/i).test(_navigator.userAgent);

  var skipElement = _document.getElementById("fox-skip-button");
  function skipRemove(value) {
    var parent = skipElement.parentElement;
    if (parent) parent.removeChild(skipElement);
    return value;
  }

  var signatureElement = _document.getElementById("fox-signature-image");
  function signatureShow() {
    signatureElement.className = "";
  }

  var time = (function () {
    var speedMultiplier = 1.8;

    if (_localStorage) {
      var storageItem = "foxdev-last-visit";

      var tsNow = (new _Date()).getTime();
      var tsLastVisit = _localStorage.getItem(storageItem);
      var tsDiff = tsNow - tsLastVisit;

      if (tsDiff < 180000) {
        speedMultiplier = 3.5;
      } else if (tsDiff < 600000) {
        speedMultiplier = 2.5;
      }

      _localStorage.setItem(storageItem, "" + tsNow);
    }

    if (speedMultiplier > 1) {
      skipElement.removeChild(skipElement.firstChild);
      skipElement.appendChild(_document.createTextNode("speedy typing"));
    }

    skipElement.onclick = function (ev) {
      if (ev.preventDefault) {
        ev.preventDefault();
      } else {
        ev.returnValue = false;
      }
      skipRemove();
      speedMultiplier = 1000;
      _console.log("going speedy mode");
    };

    return function (ms) {
      return function () {
        return speedMultiplier < 5 ? ms / speedMultiplier : 0;
      };
    };
  })();

  var cursor = (function () {
    var element = _document.getElementById("fox-cursor");

    function toggle(shown) {
      element.className = shown ? "" : "fox-hidden";
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

  function provider(value) {
    return function () {
      return value;
    };
  }

  function bind(fn) {
    var args1 = _Array_prototype_slice.call(arguments, 1);
    return function () {
      var args2 = _Array_prototype_slice.call(arguments, 0);
      return fn.apply(this, args1.concat(args2));
    };
  }

  function wait(fnTime, value) {
    if (isRobot) {
      return createPending(function (resolve) {
        resolve(value);
      });
    } else {
      return createPending(function (resolve) {
        _setTimeout(function () {
          resolve(value);
        }, fnTime());
      });
    }
  }

  var targetElement = _document.getElementById("fox-target");
  function targetAppendTextNode() {
    return targetElement.appendChild(_document.createTextNode(""));
  }

  function writeOverwrite(text, target) {
    target.nodeValue = text;
    return target;
  }

  function writeSlowly(fnTime, text, target) {
    if (isRobot) {
      return createPending(function (resolve) {
        target.nodeValue += text;
        resolve(target);
      });
    }
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
      }, fnTime());
    });
  }

  function outputLink(text, href) {
    var targetLink = targetElement.appendChild(_document.createElement("a"));
    return wait(time(100), targetLink.appendChild(_document.createTextNode("")))
      .then(bind(writeSlowly, time(40), text))
      .then(bind(wait, time(10)))
      .then(function () {
        targetLink.href = href;
      });
  }

  function outputLinkPrefixed(prefix, text, href) {
    return wait(time(100))
      .then(targetAppendTextNode)
      .then(bind(writeSlowly, time(10), "\n"))
      .then(bind(writeSlowly, time(30), prefix))
      .then(bind(outputLink, text, href));
  }

  function outputQuotes() {
    var quotes = [
      "love u always"
    //"licking under armpits"
    , "least-privileged user account"
    //"link-up america"
    , "the portuguese word for the moon"
    , "the portuguese word for the moon, derived from the latin word l\u016Bna"
    , "the portuguese word for a full moon"
    //"the word used to call somebody moody in portuguese"
    , "the lightweight embeddable programming language"
    , "the programming language that powers roblox"
    , "the programming language that powers garry's mod"
    //"the ancient hawaiian martial art"
    , "Lua Saturni, the not-so-well-known roman goddess"
    ];

    var pending = wait(time(100)).then(targetAppendTextNode);

    for (var n = 5; n--; ) {
      pending = pending
        .then(bind(wait, time(300)))
        .then(bind(writeOverwrite, quotes.splice(_Math.random() * quotes.length | 0, 1)[0]));
    }

    return pending;
  }

  function nextLine(target) {
    return wait(time(100), target)
      .then(bind(writeSlowly, time(10), "\n\n"))
      .then(bind(wait, time(100)))
      .then(targetAppendTextNode);
  }

  wait(time(700))
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
    .then(bind(writeSlowly, time(40), "I'm an avid software engineer, computer scientist, systems administrator"))
    .then(bind(writeSlowly, time(80), ", "))
    .then(bind(writeSlowly, time(40), "and a professional foxgirl"))
    .then(bind(writeSlowly, time(80), " "))
    .then(bind(writeSlowly, time(120), ":3"))
    .then(nextLine)
    .then(bind(writeSlowly, time(40), "I offer software development commissions"))
    .then(bind(writeSlowly, time(80), ". "))
    .then(bind(writeSlowly, time(40), "If you need a Minecraft mod, Discord bot, website, or anything else"))
    .then(bind(writeSlowly, time(80), ", "))
    .then(bind(writeSlowly, time(40), "contact me!"))
    .then(bind(writeSlowly, time(80), " "))
    .then(bind(outputLink, "details & terms", "/commissions/"))
    .then(targetAppendTextNode)
    .then(nextLine)
    .then(bind(writeSlowly, time(40), "You should come find me around the web"))
    .then(bind(writeSlowly, time(80), "!!"))
    .then(bind(outputLinkPrefixed, "  Email    \u2192  ", "lua@foxgirl.dev", "mailto:lua@foxgirl.dev"))
    .then(bind(outputLinkPrefixed, "  Discord  \u2192  ", "@luavixen_", "https://discord.com/users/1174552240862806046"))
    .then(bind(outputLinkPrefixed, "  GitHub   \u2192  ", "github.com/luavixen", "https://github.com/luavixen"))
    .then(bind(outputLinkPrefixed, "  Ko-fi    \u2192  ", "ko-fi.com/luavixen", "https://ko-fi.com/luavixen"))
    .then(bind(outputLinkPrefixed, "  Bluesky  \u2192  ", "bsky.app/profile/lua.pet", "https://bsky.app/profile/lua.pet"))
    .then(bind(outputLinkPrefixed, "  Mastodon \u2192  ", "vixen.zone/@lua", "https://vixen.zone/@lua"))
    .then(bind(outputLinkPrefixed, "  Twitter  \u2192  ", "twitter.com/luavixen", "https://twitter.com/luavixen"))
  //.then(bind(outputLinkPrefixed, "  Cohost   \u2192  ", "cohost.org/lua", "https://cohost.org/lua"))
  //.then(bind(outputLinkPrefixed, "  Tumblr   \u2192  ", "tumblr.com/luavixen", "https://www.tumblr.com/luavixen"))
    .then(bind(outputLinkPrefixed, "  Sona     \u2192  ", "/vikkie/", "https://foxgirl.dev/vikkie/"))
    .then(skipRemove)
    .then(targetAppendTextNode)
    .then(nextLine)
    .then(bind(writeSlowly, time(50), "Thank you for checking out my page"))
    .then(bind(wait, time(100)))
    .then(bind(writeSlowly, time(80), " "))
    .then(bind(writeSlowly, time(120), "<3"))
    .then(bind(wait, time(300)))
    .then(bind(writeSlowly, time(80), "\n\n\n\n"))
    .then(bind(wait, provider(3000)))
    .then(cursor.hide)
    .then(signatureShow)
    .then(function () { _console.log("printing completed"); }, _console.error);

  _console.log("hey !!! i see u snooping around back here :3");
  _console.log("come check out the ./script.js file!! i put a lot of effort into it");
  _console.log("one of my main goals was internet explorer compatibility");
  _console.log("so the way im doing things is a little outdated");
  _console.log("also!! marvel at the beauty of my micro promise implementation");

})();
