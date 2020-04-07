"use strict";

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _createForOfIteratorHelper(o) { if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (o = _unsupportedIterableToArray(o))) { var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var it, normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var glob = require("glob");

var detective = require("detective");

var es6detective = require("detective-es6");

var compiler = require("vue-template-compiler");

var colors = require("colors/safe");

var ora = require("ora");

var logSymbols = require("log-symbols");

var argv = require("yargs").argv;

var _require = require("child_process"),
    execSync = _require.execSync;

var packageJson = require("package-json");

var isBuiltInModule = require("is-builtin-module");

var https = require("https");
/* File reader
 * Return contents of given file
 */


var readFile = function readFile(path) {
  var content = _fs["default"].readFileSync(path, "utf8");

  return content;
};
/* Get installed modules
 * Read dependencies array from package.json
 */


var getInstalledModules = function getInstalledModules() {
  var content = JSON.parse(readFile("package.json"));
  var installedModules = [];
  var dependencies = content.dependencies || {};
  var devDependencies = content.devDependencies || {};

  for (var _i = 0, _Object$keys = Object.keys(dependencies); _i < _Object$keys.length; _i++) {
    var key = _Object$keys[_i];
    installedModules.push({
      name: key,
      dev: false
    });
  }

  for (var _i2 = 0, _Object$keys2 = Object.keys(devDependencies); _i2 < _Object$keys2.length; _i2++) {
    var _key = _Object$keys2[_i2];
    installedModules.push({
      name: _key,
      dev: true
    });
  }

  return installedModules;
};
/* Get all js and vue files files
 * Return path of all js files
 */


var getFilesPath = function getFilesPath() {
  var path1 = glob.sync("**/*.js", {
    ignore: ["node_modules/**/*"]
  }); // const path4 = glob.sync("./package/*.ts", { ignore: ["node_modules/**/*"] });

  var path2 = glob.sync("**/*.jsx", {
    ignore: ["node_modules/**/*"]
  });
  var path3 = glob.sync("**/*.vue", {
    ignore: ["node_modules/**/*"]
  }); // return path4;

  return path1.concat(path2, path3);
};
/* Check for valid string - to stop malicious intentions */


var isValidModule = function isValidModule(name) {
  // let regex = new RegExp("^([a-z0-9-_]{1,})$");
  var regex = new RegExp("^([@a-z0-9-_/]{1,})$");
  return regex.test(name);
};
/* Find modules from file
 * Returns array of modules from a file
 */


var getModulesFromFile = function getModulesFromFile(path) {
  var content = _fs["default"].readFileSync(path, "utf8");

  var output;
  if (path.endsWith(".vue")) output = compiler.parseComponent(content).script.content;else output = content; // return output;

  var modules = [];

  try {
    //set options for acorn.js used in detective module
    var detectiveOptions = {
      parse: {
        sourceType: "module"
      }
    }; //sniff file for commonJS require statements

    modules = detective(output, detectiveOptions); //sniff file for ES6 import statements

    var es6modules = es6detective(output, detectiveOptions);
    modules = modules.concat(es6modules); // return modules;

    modules = modules.filter(function (module) {
      return isValidModule(module);
    });
  } catch (err) {
    console.log(err);
  }

  return modules;
};
/* Is test file?
 * [.spec.js, .test.js] are supported test file formats
 */


var isTestFile = function isTestFile(name) {
  return name.endsWith(".spec.js") || name.endsWith(".test.js");
};
/* Dedup similar modules
 * Deduplicates list
 * Ignores/assumes type of the modules in list
 */


var deduplicateSimilarModules = function deduplicateSimilarModules(modules) {
  var dedupedModules = [];
  var dedupedModuleNames = [];

  var _iterator = _createForOfIteratorHelper(modules),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _module = _step.value;

      if (!dedupedModuleNames.includes(_module.name)) {
        dedupedModules.push(_module);
        dedupedModuleNames.push(_module.name);
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return dedupedModules;
};
/* Dedup modules
 * Divide modules into prod and dev
 * Deduplicates each list
 */


var deduplicate = function deduplicate(modules) {
  var dedupedModules = []; //push 'dev' dependecies into array

  var testModules = modules.filter(function (module) {
    return module.dev;
  });
  dedupedModules = dedupedModules.concat(deduplicateSimilarModules(testModules)); //push 'prod' dependecies into array

  var prodModules = modules.filter(function (module) {
    return !module.dev;
  });
  dedupedModules = dedupedModules.concat(deduplicateSimilarModules(prodModules));
  return dedupedModules;
};
/* Get used modules
 * Read all .js, .vue. jsx files and grep for modules
 */


var getUsedModules = function getUsedModules() {
  //grab all files matching extensions programmed in "getFilesPath" function
  var filesPath = getFilesPath();
  var usedModules = []; //loop through returned 'filesPath' array

  var _iterator2 = _createForOfIteratorHelper(filesPath),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var filePath = _step2.value;
      // Sniff files matching filepath for modules in file
      var modulesFromFile = getModulesFromFile(filePath); //check and set set 'dev' key on file extenstion matching ".test.js" or ".spec.js"

      var dev = isTestFile(filePath);

      var _iterator3 = _createForOfIteratorHelper(modulesFromFile),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var name = _step3.value;
          usedModules.push({
            name: name,
            dev: dev
          });
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  usedModules = deduplicate(usedModules);
  return usedModules;
}; // console.log(getUsedModules());

/* Handle error
 * Pretty error message for common errors
 */


var handleError = function handleError(err) {
  if (err.includes("E404")) {
    console.log(colors.yellow("Module is not in the npm registry."), err);
  } else if (err.includes("ENOTFOUND")) {
    console.log(colors.red("Could not connect to npm, check your internet connection!"), err);
  } else console.log(colors.red("error ===>", err));
};
/* Command runner
 * Run a given command
 */


var runCommand = function runCommand(command) {
  var succeeded = true;

  try {
    execSync(command, {
      encoding: "utf8"
    });
  } catch (error) {
    succeeded = false;
    handleError(error["stderr"]);
  }

  return succeeded;
};
/* Show pretty outputs
 * Use ora spinners to show what's going on
 */


var startSpinner = function startSpinner(message, type) {
  var spinner = ora();
  spinner.text = message;
  spinner.color = type;
  spinner.start();
  return spinner;
};

var stopSpinner = function stopSpinner(spinner, message, type) {
  spinner.stop();
  if (!message) return;
  var symbol;
  if (type === "red") symbol = logSymbols.error;else if (type === "yellow") symbol = logSymbols.warning;else symbol = logSymbols.success;
  console.log(symbol, message);
};
/* Is module popular? - for secure mode */


var POPULARITY_THRESHOLD = 10000;

var isModulePopular = function isModulePopular(name, callback) {
  var spinner = startSpinner("Checking ".concat(name), "yellow");
  var url = "https://api.npmjs.org/downloads/point/last-month/".concat(name);
  https.get(url).then(function (response) {
    var body = "";
    response.on("data", function (data) {
      body += data;
    });
    response.on("end", function () {
      stopSpinner(spinner);
      var downloads = JSON.parse(body).downloads;
      callback(downloads > POPULARITY_THRESHOLD);
    });
  })["catch"](function (error) {
    console.log(colors.red("Could not connect to npm, check your internet connection!"), error);
  });
};
/* Get install command
 *
 * Depends on package manager, dev and exact
 */


var getInstallCommand = function getInstallCommand(name, dev) {
  var packageManager = "npm";
  if (argv.yarn) packageManager = "yarn";
  var command;

  if (packageManager === "npm") {
    command = "npm install ".concat(name, " --save");
    if (dev) command += "-dev";
    if (argv.exact) command += " --save-exact";
  } else if (packageManager === "yarn") {
    command = "yarn add ".concat(name);
    if (dev) command += " --dev"; // yarn always adds exact
  }

  return command;
};
/* Install module
 * Install given module
 */


var installModule = function installModule(_ref) {
  var name = _ref.name,
      dev = _ref.dev;
  var spinner = startSpinner("".concat(colors.green("Installing"), " ").concat(name, "\n"), "green");
  var command = getInstallCommand(name, dev);
  var message = "".concat(name, " ").concat(colors.green("installed"));
  if (dev) message += " in devDependencies";
  var success = runCommand(command);
  if (success) stopSpinner(spinner, message, "green");else stopSpinner(spinner, "".concat(name, " ").concat(colors.yellow("installation failed")), "yellow");
};
/* is scoped module? */


var isScopedModule = function isScopedModule(name) {
  return name[0] === "@";
};
/* Install module if author is trusted */


var installModuleIfTrustedAuthor = function installModuleIfTrustedAuthor(_ref2) {
  var name = _ref2.name,
      dev = _ref2.dev;
  var trustedAuthor = argv["trust-author"];
  packageJson(name).then(function (json) {
    if (json.author && json.author.name === trustedAuthor) {
      installModule({
        name: name,
        dev: dev
      });
    } else console.log(colors.red("".concat(name, " not trusted")));
  });
};
/* Install module if trusted
 * Call isModulePopular before installing
 */


var installModuleIfTrusted = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref3) {
    var name, dev;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            name = _ref3.name, dev = _ref3.dev;

            // Trust scoped modules
            if (isScopedModule(name)) {
              packageJson(name).then(function () {
                return installModule({
                  name: name,
                  dev: dev
                });
              })["catch"](function (e) {
                return handleError(e.name);
              });
            } else {
              isModulePopular(name, function (popular) {
                // Popular as proxy for trusted
                if (popular) installModule({
                  name: name,
                  dev: dev
                }); // Trusted Author
                else if (argv["trust-author"]) installModuleIfTrustedAuthor({
                    name: name,
                    dev: dev
                  }); // Not trusted
                  else console.log(colors.red("".concat(name, " not trusted")));
              });
            }

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function installModuleIfTrusted(_x) {
    return _ref4.apply(this, arguments);
  };
}();
/* Get uninstall command
 *
 * Depends on package manager
 */


var getUninstallCommand = function getUninstallCommand(name) {
  var packageManager = "npm";
  if (argv.yarn) packageManager = "yarn";
  var command;
  if (packageManager === "npm") command = "npm uninstall ".concat(name, " --save");else if (packageManager === "yarn") command = "yarn remove ".concat(name);
  return command;
};
/* Uninstall module */


var uninstallModule = function uninstallModule(_ref5) {
  var name = _ref5.name,
      dev = _ref5.dev;
  if (dev) return;
  var command = getUninstallCommand(name);
  var message = "".concat(name, " ").concat(colors.red("removed"));
  var spinner = startSpinner("".concat(colors.red("Uninstalling"), " ").concat(name), "red");
  runCommand(command);
  stopSpinner(spinner, message, "red");
}; // installModule({ name: "eyram", dev: false });
// uninstallModule({ name: "log-symbols", dev: false });

/* Remove built in/native modules */


var removeBuiltInModules = function removeBuiltInModules(modules) {
  return modules.filter(function (module) {
    return !isBuiltInModule(module.name);
  });
};
/* Remove file paths from module names
 * Example: convert `colors/safe` to `colors`
 */


var removeFilePaths = function removeFilePaths(modules) {
  var _iterator4 = _createForOfIteratorHelper(modules),
      _step4;

  try {
    for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
      var _module2 = _step4.value;

      var slicedName = _module2.name.split("/")[0];

      if (slicedName.substr(0, 1) !== "@") _module2.name = slicedName;
    }
  } catch (err) {
    _iterator4.e(err);
  } finally {
    _iterator4.f();
  }

  return modules;
};
/* Filter registry modules */


var filterRegistryModules = function filterRegistryModules(modules) {
  return removeBuiltInModules(removeFilePaths(modules));
};
/* Get module names from array of module objects */


var getNamesFromModules = function getNamesFromModules(modules) {
  return modules.map(function (module) {
    return module.name;
  });
};
/* Modules diff */


var diff = function diff(first, second) {
  var namesFromSecond = getNamesFromModules(second);
  return first.filter(function (module) {
    return !namesFromSecond.includes(module.name);
  });
};
/* Reinstall modules */


var cleanup = function cleanup() {
  var spinner = startSpinner("Cleaning up", "green");
  if (argv.yarn) runCommand("yarn");else runCommand("npm install");
  stopSpinner(spinner);
};
/* Does package.json exist?
 * Without package.json, most of the functionality fails
 *     installing + adding to package.json
 *     removing unused modules
 */


var packageJSONExists = function packageJSONExists() {
  return _fs["default"].existsSync("package.json");
};
/* Public helper functions */


module.exports = {
  getFilesPath: getFilesPath,
  getInstalledModules: getInstalledModules,
  getUsedModules: getUsedModules,
  filterRegistryModules: filterRegistryModules,
  installModule: installModule,
  installModuleIfTrusted: installModuleIfTrusted,
  uninstallModule: uninstallModule,
  diff: diff,
  cleanup: cleanup,
  packageJSONExists: packageJSONExists
};