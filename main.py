from app.agent_chain import get_sql_chain

if __name__ == "__main__":
    chain = get_sql_chain(verbose=True)
    
    while True:
        question = input("Ask a data question: ")
        if question.lower() in ['exit', 'quit']: break
        response = chain.run(question)
        print("\nAnswer:", response, "\n")