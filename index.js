#!/usr/bin/env node
/**
 * @author xuweichen@meitu.io
 * @date 2017/8/22
 */

var chalk = require('chalk');
var program = require('commander');
var fs = require('fs');
var process = require('process');
var spawn = require('child_process').spawn;
var NPM = (process.platform === 'win32') ? 'npm.cmd' : 'npm';
var YARN = (process.platform === 'win32') ? 'yarn.cmd' : 'yarn';
var path = require('path');
process.env.NODE_ENV = 'development';
const root = process.cwd();
const types = {
    error   : chalk.bold.red,
    warning : chalk.keyword('orange'),
    success : chalk.green,
    log     : function(msg){return msg}
};

function log(message, type) {
    type = type||'log';
    console.log(`${chalk.bold("react-iso-cli: ")}${types[type](message)}`)
}

program
    .version('0.0.1')
    .usage('init [projectName]')
    .option('-v, --version', 'output the version', function(){console.log(this.opts('version'))})


program
    .command('init <name>')
    .description('create a react-iso project')
    .option('-i, --iso [value]', 'specify a version')
    .action(initProject);

program.parse(process.argv);
function initPackageJSON(projectName, version){
    var json = {
        "name": projectName,
        "dependencies": {
            "react-iso": version
        }
    }
    log('init temp package.json to project file')
    fs.writeFileSync((path.join(process.cwd() ,'package.json')), `${JSON.stringify(json, null, 4)}`);

}
function initProject(projectName, program){

    if(fs.existsSync(projectName)){
        log(`${projectName} was existed`, 'error')
    }else{
        log(`create folder <${projectName}>`);
        fs.mkdirSync(projectName);
        process.chdir(path.resolve(root, projectName));
        console.log(program.iso,'program.iso');
        initPackageJSON(projectName, program.iso||'latest');
        installDependencies(tidyDirectories);
    }

}
function installDependencies(callback){
    //npm install --development 会安装devDependencies, --production只会安装dependencies
    var install = spawn(NPM, ['install', '--verbose', '--registry=https://registry.npm.taobao.org/', '--development'], {stdio: 'inherit'});
    install.on('close', function(code) {
        if (code !== 0) {
            console.error(code)
            return;
        }
        log('install success', 'success');
        callback && callback()

    })

}
function moveDirectories(source, dest, callback){
    fs.readdirSync(source).forEach(function (file) {
        console.log('move', file)
        var pathname = path.join(source, file);

        if (fs.statSync(pathname).isDirectory()) {
            var destPath = path.resolve(dest, file);
            if(!fs.existsSync(destPath)){
                fs.mkdirSync(destPath)
            }
            moveDirectories(pathname, destPath);
        } else {
            fs.writeFileSync(path.resolve(dest, file), fs.readFileSync(pathname));
            fs.unlinkSync(pathname);
        }
    });
    fs.rmdirSync(source);
    callback &&  callback();
}
function tidyDirectories(){
    log('start tidy directories')
    var cwd = process.cwd();
    var source = path.resolve(cwd,'node_modules','react-iso');
    var dest = cwd;
    moveDirectories(source, dest, function(err) {
        if(err){
            console.log(err)
            log('tidy directories failed', 'error')
        }else{
            log('tidy directories successfully');
            log('install dependencies');
            installDependencies(function(){
                log('dependencies installed successfully');
                showHelp()
            })
        }

    });

}
function showHelp(){
    log(`use ${chalk.bold.green("\`npm run dev\`")}to run your project`)
}
showHelp()
