import { Client, Databases, ID, Query } from "appwrite"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)
;
//accesses the database of appwrite
const database = new Databases(client);


export const updateSearchCount = async (searchTerm, movie) => {
    //1. use appwrite SDK to check if the search tern exists in the database
    try {
       const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.equal('searchTerm', searchTerm)]) 

    //2. if it does exist, update the count
       if(result.documents.length > 0) {
        const doc = result.documents[0];
        await database.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            doc.$id,
            { count: doc.count + 1 }
          );
        } else {
        //3. if it doesn't exist, create a new document and set count as 1 
        await database.createDocument(DATABASE_ID, COLLECTION_ID,  ID.unique(), {
            searchTerm, 
            count: 1, 
            movie_id: movie.id,
            poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        })
       }
    } catch (error) {
        console.log(error)
    }
} 

//get our trendign movies
export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5),
            Query.orderDesc("count")
        ])

        return result.documents;
    } catch (error) {
        console.log(error)
    }
}