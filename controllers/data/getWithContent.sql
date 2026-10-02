SELECT 
    pd.poster_deck_title, 
    pd.poster_deck_owner, 
    r.total_ratings
FROM 
    posterdecks AS pd
JOIN (
    SELECT 
        posterId, 
        SUM(rating) AS total_ratings
    FROM 
        ratings
    GROUP BY 
        posterId
) AS r 
ON pd.poster_deck_id = r.posterId
ORDER BY 
    r.total_ratings DESC;
