# GitlabBackupUtil

A Small utility to backup all of your gitlab repositories to local filesystem.
You never know when international laws change and you loose access to your repos.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">It is painful for me to hear how trade restrictions have hurt people. We have gone to great lengths to do no more than what is required by the law, but of course people are still affected. GitHub is subject to US trade law, just like any company that does business in the US.</p>&mdash; Nat Friedman (@natfriedman) <a href="https://twitter.com/natfriedman/status/1155311121038864384?ref_src=twsrc%5Etfw">July 28, 2019</a></blockquote>

## Harduino's Fork Info
This repo contains fixes and improvements. I needed to make backups for all projects listed in https://gitlab.com/dashboard/projects, and original repo didn't do that for some repos, i.e. did partial backup.

Changes:
- refactor algorithm to form projects-to-backup. Original version formed personal projects (/api/v4/user.id/projects) & groups (/api/v4/groups, /api/v4/groups/group_id/projects). In this version that requests replaced with paginated retrieving all projects with your membership (/api/v4/projects/?membership=true).
- add pagination for retrieving projects list as Gitlab's max per_page value is set to 100
- fix & improve calculating of result folder. It was incorrect when you use custom Gitlab URL.
- fix Gitlab asked for creds even if you gave it token
- remove --verbose flag and enable verbosity (without sensitive information) by default

[!] Please note, that in this fork Gitlab's credentials (username+token) will be stored in repo's remote url for every backed up repo, e.g.
```shell
git remote -v
origin https://username:token@gitlab.com/group/project.git (fetch)
origin https://username:token@gitlab.com/group/project.git (push)
```

## How to Backup

### Backup using http (default)

```javascript
npm install -g gitlab-backup-util-harduino
gitlab-backup-util-harduino -t 'your-gl-token-here'
```

### Backup using ssh
```javascript
gitlab-backup-util-harduino -t 'your-gl-token-here' -m ssh
```

#### Future Scope
* - [✔] If the repository already exists, `git pull` instead of cloning
* - [ ] Gui for entering token


### Thats It :rocket:, Now go backup
