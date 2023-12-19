import * as yup from 'yup';

import i18next from 'i18next';
import getState from './render.js';
import { loadRSS, updateRSS } from './rss-service.js';

import resources from './locales/index.js';
import locale from './locales/locale.js';

const lng = 'ru';

export default () => {
  const i18n = i18next.createInstance();
  i18n.init({
    lng,
    resources,
  })
    .then(() => {
      const elements = {
        form: document.querySelector('form'),
        input: document.getElementById('url-input'),
        submit: document.querySelector('button[type="submit"]'),
        feedback: document.querySelector('.feedback'),
        feeds: document.querySelector('.feeds'),
        posts: document.querySelector('.posts'),
        modal: document.querySelector('.modal'),
        modalTitle: document.querySelector('.modal-title'),
        modalDescription: document.querySelector('.modal-body'),
        modalFullArticle: document.querySelector('.full-article'),
      };
      const initialState = {
        status: 'filling',
        error: null,
        posts: [],
        feeds: [],
        shownPostId: null,
        shownPostsIds: new Set(),
      };
      const state = getState(initialState, i18n, elements);
      yup.setLocale(locale);
      const validate = (url, links) => {
        const schema = yup.string()
          .required()
          .url()
          .notOneOf(links);
        return schema
          .validate(url)
          .then(() => {})
          .catch((error) => error.message);
      };
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = new FormData(e.target).get('url').trim();
        const links = state.feeds.map(({ link }) => link);
        validate(url, links)
          .then((error) => {
            if (error) {
              state.error = error;
              state.status = 'failed';
              return;
            }
            state.error = null;
            loadRSS(url, state);
          });
      });
      elements.posts.addEventListener('click', (e) => {
        const { target } = e;
        const { dataset: { id } } = target;
        if (id) {
          state.shownPostId = id;
          state.shownPostsIds.add(id);
        }
      });
      updateRSS(state);
    });
};
