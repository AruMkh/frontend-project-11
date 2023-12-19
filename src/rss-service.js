import _ from 'lodash';
import axios from 'axios';
import parser from './parser.js';

const timeout = 5000;

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

export const updateRSS = (state) => {
  const requests = state.feeds.map((feed) => axios.get(addProxy(feed.link))
    .then((response) => {
      const [, posts] = parser(response.data.contents);
      const postsFromState = state.posts.filter((post) => post.feedId === feed.id);
      const newPosts = _.differenceBy(posts, postsFromState, 'link');
      state.posts = [...newPosts, ...state.posts];
    })
    .catch((err) => console.log(err)));
  Promise.all(requests)
    .finally(() => {
      setTimeout(updateRSS, timeout, state);
    });
};
const defineError = (err) => {
  if (err.isAxiosError) {
    return 'networkError';
  }
  if (err.isParserError) {
    return 'parserError';
  }
  return 'unknowError';
};
export const loadRSS = (url, state) => {
  axios.get(addProxy(url))
    .then((responce) => {
      const [feed, posts] = parser(responce.data.contents);
      feed.id = _.uniqueId();
      feed.link = url;
      state.feeds.push(feed);
      posts.forEach((post) => {
        post.id = _.uniqueId();
        post.feedId = feed.id;
      });
      state.posts = [...posts, ...state.posts];
      state.status = 'loaded';
      state.error = null;
    })
    .catch((err) => {
      state.error = defineError(err);
      state.status = 'failed';
    });
};
