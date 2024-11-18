import React,{useEffect,useState} from 'react'
import "./NewCollections.css"

import Item from '../item/Item'



const NewCollections = () => {
    const [new_collection, setNew_Collection] = useState([])
    const backendUrl= import.meta.env.VITE_APP_BACKEND_URL;
  
    useEffect(() => {
        fetch(`${backendUrl}/newcollections`)
            .then(response => response.json())
            .then(data => setNew_Collection(data))
           
    }, []);
    

    return (
        <div className='new-collections'>
            <h1>NEW COLLECTIONS</h1>
            <hr />
            <div className="collection-wrapper">
            <div className="collections">
                {new_collection.map((item, i) => {
                    return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} old_price={item.old_price} />
                })}
            </div>
            </div>
        </div>
    )
}

export default NewCollections
