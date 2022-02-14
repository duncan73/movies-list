/**
 * Component to handle rendering of list of movies
 *
 * @type {Component}
 */
class MoviesComponent {

  // Takes moviesList as input so it can get filtered/sorted array.
  static renderMovies(moviesList) {
    if (Array.isArray(moviesList)) {
      let moviesListHtml = '';
      const config = moviesService.getConfig();

      // Default poster size is set up manually. It can be done programmatically or 'original' can be used.
      // But that will add unnecessary complexity and heavy data load.
      const posterSize = 'w342';

      moviesList.forEach(movie => {
        // In template here there are several hidden information not part of requirement therefore visible
        // only in list view.
        moviesListHtml += `
          <div class="movie-item">
              <div class="movie-poster"><img src="${config.images.base_url}${posterSize}${movie.poster_path}"></div>
              <div class="movie-details">
                  <div class="movie-title">${movie.title}</div>
                  <div class="movie-genres">${movie.genres}</div>
                  <div class="movie-plot hidden">${movie.overview}</div>
                  <div class="movie-rating hidden">TMDb Rating: ${movie.vote_average * 10}%</div>
                  <div class="movie-release-date hidden">Release Date: ${movie.release_date}</div>
                  <div class="movie-popularity hidden">${movie.popularity}</div>
              </div>
          </div>
        `;
      });

      document.querySelector('#movies-list').innerHTML = moviesListHtml;
    }
  }
}

/**
 * Component to handle filters rendering
 *
 * @type {Component}
 */
class MoviesFilterComponent {
  // This function renders 2 filters - rating and genres
  static renderFilters(data) {
    // Rating filter can be presented may ways - as number input, as range slider, as stars, as select... Or anything
    // what will be required. For simplicity select is used.
    let ratingInputHtml = `<select name="rating" onchange="MoviesApp.filterByRating(this.value)">`;

    for (let i = 0; i <= 10; i += 0.5) {
      ratingInputHtml += `<option value="${i}" ${i === 3 ? 'selected' : ''}>${i}</option>`;
    }
    ratingInputHtml += `</select>`;
    document.querySelector('.movie-filter.rating .movie-filter-container').innerHTML = ratingInputHtml;

    // For genres styled checkboxes are used (as requested).
    if (Array.isArray(data.genres)) {
      let genresInputHtml = '';

      data.genres.forEach(genre => {
        genresInputHtml += `
          <label class="movie-filter-item" onchange="MoviesApp.filterByGenre(${genre.id}, this)">
            <input name="genre" value="${genre.id}" type="checkbox" />
            <span class="checkbox"></span>
            ${genre.name}
          </label>
        `;
      });
      document.querySelector('.movie-filter.genres .movie-filter-container').innerHTML = genresInputHtml;
    }
  }

  // Static method to change checked state (visually)
  static toggleCheckbox(elm) {
    const input = elm.querySelector('input');
    const checkbox = elm.querySelector('.checkbox');

    checkbox.classList.toggle('checked', input.checked);
  }
}

/**
 * Service to handle filtering
 *
 * @type {Service}
 */
class MoviesFilterService {
  constructor() {
    // Set default filters.
    this.resetFilters();
  }

  // Sets 2 possible filters depending on input.
  setFilter(filter, value) {
    if (filter === 'rating') {
      this.filters.rating = Number(value);
    }

    if (filter === 'genres') {
      const index = this.filters.genres.indexOf(parseInt(value));

      // Here if the genre exist it is removed. Otherwise it is added. This allows to call setFilter for genres
      // always with value, no need to specify add/remove. This does it automatically.
      if (index >= 0) {
        this.filters.genres.splice(index, 1);
      } else {
        this.filters.genres.push(value);
      }
    }
  }

  getFilter(filter) {
    return this.filters[filter];
  }

  getFilteredMoviesByRating(movies) {
    const rating = this.getFilter('rating');

    // Return filtered array of movies.
    return movies.filter(movie => movie.vote_average >= rating);
  }

  getFilteredMoviesByGenres(movies) {
    const genres = this.getFilter('genres');

    // If no genres specified return a copy of all movies.
    if (!genres.length) {
      return [...movies];
    }

    // Return filtered array of movies. Only movies with all genres specified in 'genres' filter are returned.
    return movies.filter(movie => {
      const countGenres = genres.reduce((acc, genre) => {
        return movie.genre_ids.indexOf(genre) > -1 ? acc + 1 : acc;
      }, 0);

      return genres.length === countGenres;
    });
  }

  // Reset to default.
  resetFilters() {
    this.filters = {
      genres: [],
      rating: 3
    };
  }

}

/**
 * Service to handle movies lists
 *
 * @type {Service}
 */
class MoviesService {
  constructor() {
    this.data = null;

    // Set promises to get various data from TMDb API.
    this.getConfiguration = () => {
      return axios.get('https://api.themoviedb.org/3/configuration?api_key=bb7c667e171796d26290470cfc7fec04');
    };
    this.getGenres = () => {
      return axios.get('https://api.themoviedb.org/3/genre/movie/list?api_key=bb7c667e171796d26290470cfc7fec04&language=en-US');
    };
    this.getNowPlaying = () => {
      return axios.get('https://api.themoviedb.org/3/movie/now_playing?api_key=bb7c667e171796d26290470cfc7fec04&language=en-US&region=GB');
    };
  }

  getData() {
    if (!this.data) {
      // If data does not exist then call all promises to get the data.
      return axios.all([this.getConfiguration(), this.getGenres(), this.getNowPlaying()])
                  .then(([conf, genres, movies]) => {
                    // Set the data obj.
                    this.data = {
                      conf: conf.data,
                      genres: genres.data.genres,
                      movies: movies.data.results
                    };
                    // Map genres ids to names and save them for every movie in data.movies.
                    this.addGenresNamesForAllMovies();

                    // Return resolved promise.
                    return this.data;
                  })
                  .catch((err) => {
                    console.error(err);
                  });
    } else {
      // If data are loaded already then no need to contact server. Instead, promise resolve is used to
      // return resolved promise. As such the return type is consistent.
      return Promise.resolve(this.data);
    }
  }

  getConfig() {
    return this.data.conf;
  }

  // This is basically used only once but has potential to be re-used for other properties and sort directions.
  sortMovies(sortBy = 'popularity', direction = 'asc') {
    if (direction === 'asc') {
      this.data.movies.sort((left, right) => right[sortBy] - left[sortBy]);
    } else {
      this.data.movies.sort((left, right) => left[sortBy] - right[sortBy]);
    }
  }

  // Gets filtered movies by filtering movies by rating and genres sequentially.
  getFilteredMovies() {
    const filteredMoviesByRating = moviesFilterService.getFilteredMoviesByRating(this.data.movies);
    return moviesFilterService.getFilteredMoviesByGenres(filteredMoviesByRating);
  }

  // Processes genres ids and returns them as html string for every movie.
  addGenresNamesForAllMovies() {
    this.data.movies.forEach(movie => {
      movie.genres = movie.genre_ids.map(genreId => {
        const genreObj = this.data.genres.find(genre => genreId === genre.id);
        // Wrapping each genre to a span so white space can be controlled (to not break multi-word genres).
        return `<span>${genreObj.name}</span>`;
      }).join(', ');
    });
  }
}

/**
 * Main movie app - entry point
 *
 * @type {Service}
 */
class MoviesApp {
  constructor() {
    // Render movies using default filters.
    MoviesApp.getDefaultMoviesAndRender();
  }

  static getDefaultMoviesAndRender() {
    // Get data (from promises).
    moviesService.getData().then(data => {
      moviesService.sortMovies('popularity', 'asc');

      const movies = moviesService.getFilteredMovies();

      MoviesFilterComponent.renderFilters(data);
      MoviesComponent.renderMovies(movies);
    });
  };

  static filterByGenre(genre, elm) {
    // Toggle checkbox first.
    MoviesFilterComponent.toggleCheckbox(elm);

    // Set genres filter.
    moviesFilterService.setFilter('genres', genre);

    // Get movies filtered by filter(s) set.
    MoviesComponent.renderMovies(moviesService.getFilteredMovies());
  }

  static filterByRating(rating) {
    // Set rating filter.
    moviesFilterService.setFilter('rating', rating);

    // Get movies filtered by filter(s) set.
    MoviesComponent.renderMovies(moviesService.getFilteredMovies());
  }

  static resetAllFilters() {
    // Reset all filters to default values.
    moviesFilterService.resetFilters();

    // Render filters and movies list.
    MoviesApp.getDefaultMoviesAndRender();
  }

  // Toggle visibility of the filters to save space (specially on mobiles).
  static toggleFilters(toggleElm) {
    const filterWrappers = document.querySelectorAll('.movie-filters .movie-filter');

    toggleElm.classList.toggle('hide-filters');
    toggleElm.classList.toggle('show-filters');

    // Using simple iteration as it works in every browser (instead of forEach).
    for (let i = 0; i < filterWrappers.length; i++) {
      filterWrappers[i].classList.toggle('hidden');
    }
  }

  // Toggle listing type. Default is gallery.
  static toggleListing(type) {
    const listWrapper = document.querySelector('#movies-list');

    if (listWrapper.className !== type) {
      const links = document.querySelectorAll('.movie-filter-settings .listing');

      // Using simple iteration as it works in every browser (instead of forEach).
      for (let i = 0; i < links.length; i++) {
        links[i].classList.toggle('active');
      }

      listWrapper.className = type;
    }
  }
}

const moviesService = new MoviesService();
const moviesFilterService = new MoviesFilterService();

// Init app
new MoviesApp();
