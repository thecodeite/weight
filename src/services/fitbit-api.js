import ls from './ls'
import moment from 'moment'
const callbacks = {}

const {apiPrefix, apiDomain, loginUrl, authorizeUrl} = global.config

const faApi = {
  getMe: reload => getAndCache(apiPrefix + '/users/me', 'user', reload),
  getCompany: reload => getAndCache(apiPrefix + '/company', 'company', reload),
  getActiveProjects: reload => getAndCache(apiPrefix + '/projects?view=active', 'projects', reload),
  getActiveTasks: reload => getAndCache(apiPrefix + '/tasks?view=active', 'tasks', reload),

  resolveProject: projectUrl => getAndCache(projectUrl, 'project'),
  resolveTask: taskUrl => getAndCache(taskUrl, 'task'),
  resolveContact: contactUrl => getAndCache(contactUrl, 'contact'),
  readTimeslips: (fromDate, toDate) => readList(apiPrefix + `/timeslips?from_date=${fromDate}&to_date=${toDate}`, 'timeslips'),

  createTimeslips,
  deleteTimeslip,
  completeTask
}

Promise.all([faApi.getMe(false), faApi.getMe(true)])
  .then(([meCached, meFresh]) => {
    if (meCached.url !== meFresh.url) {
      console.log('meCached.url !== meFresh.url', meCached.url, '!==', meFresh.url)
      console.log('Cache invalid, clearing')

      ls.clear(apiPrefix)
    }
  })

function completeTask (taskUrl) {
  const body = JSON.stringify({
    task: {
      status: 'Completed'
    }
  })

  return window.fetch(taskUrl, {
    credentials: 'include',
    method: 'PUT',
    body: body,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

function deleteTimeslip (timeslipUrl) {
  return window.fetch(timeslipUrl, {
    credentials: 'include',
    method: 'DELETE'
  })
}

function createTimeslips (taskUrl, hours, dates, comment) {
  return Promise.all([faApi.getMe(), faApi.resolveTask(taskUrl)])
    .then(([me, task]) => {
      const data = {
        timeslips: dates.map(date => {
          return {
            user: me.url,
            project: task.project,
            task: task.url,
            dated_on: date.format('YYYY-MM-DD'),
            hours: hours,
            updated_at: moment().toISOString(),
            created_at: moment().toISOString(),
            comment: comment && comment.length ? comment : undefined
          }
        })
      }

      const body = JSON.stringify(data)
      const url = apiPrefix + '/timeslips'

      return window.fetch(url, {
        credentials: 'include',
        method: 'POST',
        body: body,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
}

function handleFetchError (response) {
  if (response.status === 401) {
    window.location = loginUrl + '?redirect=' + window.location
    return
  }

  if (response.status === 403) {
    window.location = `${authorizeUrl}?domain=${apiDomain}&redirect=${window.location}`
    return
  }

  throw new Error(response.status)
}

function readList (url, propertyName) {
  return new Promise((resolve, reject) => {
    next(url)
    let progress
    function next (url) {
      let link
      window.fetch(url, {credentials: 'include'})
        .then(response => {
          if (!response.ok) {
            return handleFetchError(response)
          }
          link = response.headers.get('link')
          return response.json()
        })
        .then(data => {
          if (progress) {
            progress[propertyName] = progress[propertyName].concat(data[propertyName])
          } else {
            progress = data
          }

          var links = readLinks(link)

          if (links.next) {
            next(links.next)
          } else {
            resolve(progress)
          }
        })
        .catch(err => {
          console.log('err:', err)

          reject(err)
        })
    }
  })
}

function readLinks (link) {
  if (!link || link === '') {
    return {}
  }

  var bits = link.split(',')

  var res = bits.reduce((result, bit) => {
    var leftRight = bit.split(';')
    var linkVal = leftRight[0].trim().substr(1).slice(0, -1)
    var linkName = leftRight[1].trim().substr(5).slice(0, -1)
    result[linkName] = linkVal
    return result
  }, {})

  return res
}

function getAndCache (url, transform, reload) {
  return new Promise((resolve, reject) => {
    const cacheKey = url
    const value = ls.getItem(cacheKey)

    if (value && !reload) {
      // console.log('object: ', url, value)
      let resolvedValue
      if (typeof transform === 'function') resolvedValue = transform(value)
      else if (transform) resolvedValue = value[transform]
      else resolvedValue = value
      return resolve(resolvedValue)
    }

    const resolver = {resolve, reject, transform}
    if (Array.isArray(callbacks[url])) {
      callbacks[url].push(resolver)
      return
    }

    callbacks[url] = [resolver]

    // console.log('Requesting: ', url);
    window.fetch(url, {credentials: 'include'})
      .then(response => {
        if (!response.ok) {
          return handleFetchError(response)
        }
        return response.json()
      })
      .then(data => {
        // console.log('Success: ', url, data);
        ls.setItem(cacheKey, data)

        const resolvers = callbacks[url]

        resolvers.forEach(resolver => {
          let resolvedData
          if (typeof resolver.transform === 'function') resolvedData = transform(data)
          else if (resolver.transform) resolvedData = data[transform]
          else resolvedData = data
          resolver.resolve(resolvedData)
        })
        delete callbacks[url]
      })
      .catch(err => {
        console.error('Fail: ', url)
        console.error(err)

        if (err === 401) {
          window.location = '/fatt/faauth'
        }
      })
  })
}

export default faApi
