import { useState, useEffect } from "react";
import { useDebounce } from "react-use";
import "./App.css";

import Search from "./components/Find";
import Spinner from "./components/Spinner";
import MovieCard from "./components/movieCard";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

// api request
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_BASE_URL = "https://api.themoviedb.org/3";
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

function App() {
  const [searchTerm, setSearchTerm] = useState(""); // tracks the user search input
  const [errorMsg, setErrorMsg] = useState(""); //error message
  const [trendingErrorMsg, setTrendingErrorMsg] = useState(""); //error for trending part
  const [movieList, setMovieList] = useState([]); // gets movielist
  const [isLoading, setIsLoading] = useState(false); //loading spinner
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // manages the debounced searchterm
  const [trendingMovies, setTrendingMovies] = useState([]);

  // allows the user to stop trying for 500ms before making a search to prevent multiple
  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm);
    },
    700,
    [searchTerm]
  );

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const endPoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endPoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      //if the fetching fails
      if (data.response === "false") {
        setErrorMsg("Failed to fetch movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      //if the user searches for something, then we want to bookkeep it in our backend
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMsg("Error fetching movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      // console.error(error);
      setTrendingErrorMsg("Error fetching trending movies. Please try again later.");
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  //to laod trending movies
  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      {/*  header part */}
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero banner" />
          <h1>
            Find <span className="text-gradient">Movies</span>You'll Enjoy
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            {trendingErrorMsg ? <p className="text-red-500 mt-2 text-left">{trendingErrorMsg}</p> :
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
            }
          </section>
        )}

        <section className="all-movies">
          <h2 className="text-left">All Movies</h2>
          {isLoading ? (
            <p className="text-white">
              <Spinner />
            </p>
          ) : errorMsg ? (
            <p className="text-red-500">{errorMsg}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
