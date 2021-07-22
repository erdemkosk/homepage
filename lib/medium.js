import axios from 'axios'

async function getFeed(userName) {
  let feed = await axios.get(
    'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@' + userName
  )

  return feed?.data?.items
}

export { getFeed }
