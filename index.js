#!/usr/bin/env node

'use strict'

const fs = require('fs')
const rp = require('request-promise')
const _ = require('lodash')
const Promise = require('bluebird')
const cmd = require('node-cmd')
const parseUrl = require('parse-url');
const cmdAsync = Promise.promisify(cmd.get, {
  multiArgs: true,
  context: cmd
})
const cliProgress = require('cli-progress');

(async () => {
  let argv = require('yargs')
    .usage('Utility to backup all gitlab repos to a local directory')
    .option('token', {
      alias: 't',
      type: 'string',
      description: 'Gitlab Token'
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Backup to output directory, defaults to ./gitlab-backup'
    })
    .option('url', {
      alias: 'u',
      type: 'string',
      description: 'Specify Gitlab instance URL'
    })
    .option('method', {
      alias: 'm',
      type: 'string',
      description: 'Specify clone method (default is http)'
    })
    .help(true)
    .argv

  const baseUrl = argv.url || 'https://gitlab.com'
  console.log(`Set gitlab url to ${baseUrl}`)
  console.log()
  if (!argv.token) {
    console.log(
      `Please pass your gitlab token using the --token flag,\nGet your token at ${baseUrl}/profile/personal_access_tokens\n\npass --help for full help\n\n`
    )
    process.exit(1)
  }

  const method = argv.method == 'ssh' ? 'ssh_url_to_repo' : 'http_url_to_repo'
  const requestOptions = {
    json: true,
    qs: {
      simple: true
    },
    headers: {
      'PRIVATE-TOKEN': argv.token
    }
  }

  const user = await rp.get(`${baseUrl}/api/v4/user`, requestOptions)
  console.log(`Got user: ${user.name} (${user.username}) ID: ${user.id}`)

  let membershipProjects = [];
  const perPage = 100;
  for (let page = 1;page < 1000;page++) {
    console.log(`Retrieve page ${page} of membership projects`);

    const pageItems = await rp.get(
      `${baseUrl}/api/v4/projects?membership=true&page=${page}&per_page=${perPage}`,
      requestOptions
    )

    if (!pageItems.length) {
      break;
    }

    membershipProjects = [...membershipProjects, ...pageItems];
  }

  let pgits = _.map(membershipProjects, 'http_url_to_repo')

  console.log(`Backing up ${pgits.length} repos`)

  const cloneProgressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.legacy
  )
  cloneProgressBar.start(pgits.length, 0)

  let index = 0
  for (let repo of pgits) {
    const { protocol, resource, pathname } = parseUrl(repo);
    const repoName = pathname.substring(1, pathname.length - 4);
    const repoPath = `${argv.output || 'gitlab-backup'}/${repoName}`

    if (fs.existsSync(repoPath)) {
      const stats = fs.statSync(repoPath)

      if (!stats.isDirectory) {
        console.error(`Path ${repoPath} exist and not a directory. Skipped.`)
      } else {
        console.log(`Pulling ${repoName}`)
        const stdout = await cmdAsync(`git -C ${repoPath} pull`).catch(
          console.log
        )
      }
    } else {
      console.log(`Cloning ${repoName}`)
      const { protocol, resource, pathname } = parseUrl(repo);
      const repoWithCreds = `${protocol}://${user.username}:${argv.token}@${resource}${pathname}`;
      const stdout = await cmdAsync(`git clone ${repoWithCreds} ${repoPath}`).catch(
        console.log
      )
    }

    cloneProgressBar.update(++index)
  }

  cloneProgressBar.stop()
})()
